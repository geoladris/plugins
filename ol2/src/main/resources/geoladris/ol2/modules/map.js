define([ "message-bus", "module", "openlayers" ], function(bus, module) {

	var GeoJSON = new OpenLayers.Format.GeoJSON();
	
	var map = null;

	OpenLayers.ProxyHost = "proxy?url=";

	map = new OpenLayers.Map(module.config().htmlId, {
		fallThrough : true,
		theme : null,
		projection : new OpenLayers.Projection("EPSG:900913"),
		displayProjection : new OpenLayers.Projection("EPSG:4326"),
		units : "m",
		allOverlays : true,
		controls : []
	});

	bus.listen("map:layerVisibility", function(event, message) {
		var layer = map.getLayer(message.layerId);
		layer.setVisibility(message.visibility);
	});

	function isArray(variable) {
		return Object.prototype.toString.call(variable) === '[object Array]';
	}

	bus.listen("zoom-in", function(event) {
		map.zoomIn();
	});

	bus.listen("zoom-out", function(event) {
		map.zoomOut();
	});

	function getCRSOr4326(obj) {
		var crsName = obj.hasOwnProperty("crs") ? obj.crs : "EPSG:4326";
		return new OpenLayers.Projection(crsName);
	}

	bus.listen("zoom-to", function(event, msg) {
		if (msg instanceof OpenLayers.Bounds) {
			map.zoomToExtent(msg);
		} else if (msg instanceof Array) {
			map.zoomToExtent(msg);
		} else if (msg instanceof Object) {
			var center = new OpenLayers.LonLat(msg.x, msg.y);
			center.transform(getCRSOr4326(msg), map.projection);

			var zoomLevel = msg.zoomLevel;
			if (zoomLevel && zoomLevel < 0) {
				zoomLevel = Math.max(1, map.getNumZoomLevels() + zoomLevel);
			}
			map.setCenter(center, zoomLevel);
		}
	});

	bus.listen("map:setLayerOpacity", function(event, message) {
		var layer = map.getLayer(message.layerId);
		layer.setOpacity(message.opacity);
	});

	/*
	 * To simulate clicks. Used at least in the tour
	 */
	bus.listen("map-click", function(event, lat, lon) {
		var mapPoint = new OpenLayers.LonLat(lon, lat);
		mapPoint.transform(new OpenLayers.Projection("EPSG:4326"), map.projection);
		map.events.triggerEvent("click", {
			xy : map.getPixelFromLonLat(mapPoint)
		});
	});

	bus.listen("map:removeLayer", function(e, message) {
		var layer = map.getLayer(message.layerId);
		layer.removeAllFeatures();
		map.removeLayer(layer);
	});

	bus.listen("map:removeAllLayers", function(e) {
		if (map !== null) {
			while (map.layers.length > 0) {
				map.removeLayer(map.layers[map.layers.length - 1]);
			}
		}
	});

	bus.listen("map:addLayer", function(e, message) {
		var layer = null;
		if (message.vector) {
			var vectorLayer = message.vector;
			var styles = new OpenLayers.StyleMap(vectorLayer.style);

			var layer = new OpenLayers.Layer.Vector(message.layerId, {
				styleMap : styles
			});
		} else if (message.osm) {
			layer = new OpenLayers.Layer.OSM(message.layerId, message.osm.osmUrls);
		} else if (message.gmaps) {
			layer = new OpenLayers.Layer.Google(message.layerId, {
				type : google.maps.MapTypeId[message.gmaps["gmaps-type"]]
			});
		} else if (message.wfs) {
			layer = new OpenLayers.Layer.Vector("WFS", {
				strategies : [ new OpenLayers.Strategy.Fixed() ],
				protocol : new OpenLayers.Protocol.WFS({
					version : "1.0.0",
					url : message.wfs.baseUrl,
					featureType : message.wfs.wmsName
				}),
				projection : new OpenLayers.Projection("EPSG:4326")
			});
		} else if (message.wms) {
			layer = new OpenLayers.Layer.WMS(message.layerId, message.wms.baseUrl, {
				layers : message.wms.wmsName,
				buffer : 0,
				transitionEffect : "resize",
				removeBackBufferDelay : 0,
				isBaseLayer : false,
				transparent : true,
				format : message.wms.imageFormat || 'image/png'
			}, {
				noMagic : true
			});
		}
		if (layer != null) {
			layer.id = message.layerId;
			map.addLayer(layer);
			bus.send("map:layerAdded", [ message ]);
		}
	});

	bus.listen("map:mergeLayerParameters", function(e, message) {
		var layer = map.getLayer(message.layerId);
		layer.mergeNewParams(message.parameters);
	});

	bus.listen("map:setLayerIndex", function(e, message) {
		var layer = map.getLayer(message.layerId);
		map.setLayerIndex(layer, message.index);
	});

	bus.listen("map:addFeature", function(e, message) {
		var layerId = message["layerId"];
		var layer = map.getLayer(layerId);
		var feature = GeoJSON.parseFeature(message.feature);
		layer.addFeatures(feature);
		layer.redraw();
		bus.send("map:featureAdded", {
			"layerId" : layerId,
			"feature" : JSON.parse(GeoJSON.write(feature))
		});
	});

	bus.listen("map:removeAllFeatures", function(e, message) {
		var layerId = message["layerId"];
		var layer = map.getLayer(layerId);
		layer.removeAllFeatures();
		layer.redraw();
	});

	return map;
});