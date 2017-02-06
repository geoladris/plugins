define([ "message-bus", "module", "openlayers" ], function(bus, module) {

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

	bus.listen("highlight-feature", function(event, geometry) {
		var highlightLayer = map.getLayer("Highlighted Features");
		highlightLayer.removeAllFeatures();
		var feature = new OpenLayers.Feature.Vector();
		feature.geometry = new OpenLayers.Format.GeoJSON().parseGeometry(geometry);
		highlightLayer.addFeatures(feature);
		highlightLayer.redraw();
	});

	bus.listen("clear-highlighted-features", function() {
		var highlightLayer = map.getLayer("Highlighted Features");
		highlightLayer.removeAllFeatures();
		highlightLayer.redraw();
	});
	var addVectorLayer = function() {
		var id = "Highlighted Features";

		// Remove if exists
		var vector = map.getLayer(id);
		if (map !== null && vector) {
			map.removeLayer(vector);
		}

		// Create new vector layer
		vector = new OpenLayers.Layer.Vector(id, {
			styleMap : new OpenLayers.StyleMap({
				'strokeWidth' : 5,
				fillOpacity : 0,
				strokeColor : '#ee4400',
				strokeOpacity : 0.5,
				strokeLinecap : 'round'
			})
		});
		vector.id = id;
		map.addLayer(vector);
	}

	bus.listen("layers-loaded", function() {
		addVectorLayer();
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

	bus.listen("transparency-slider-changed", function(event, layerId, opacity) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				var mapLayerId = mapLayers[index];
				var layer = map.getLayer(mapLayerId);
				layer.setOpacity(opacity);
			}
			;
		}
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
				noMagic : true,
				visibility : false
			// Don't show until a "layer-visibility" event indicates so
			});
		}
		if (layer != null) {
			layer.id = message.layerId;
			map.addLayer(layer);
			bus.send("map:layerAdded", [ message ]);
		}
	});

	bus.listen("map:updateLayer", function(e, message) {
		var layer = map.getLayer(message.layerId);
		layer.mergeNewParams(message.configuration);
	});

	bus.listen("map:setLayerIndex", function(e, message) {
		var layer = map.getLayer(message.layerId);
		map.setLayerIndex(layer, message.index);
	});

	bus.listen("map:addFeature", function(e, message) {
		var layerId = message["layerId"];
		var layer = map.getLayer(layerId);
		var feature = new OpenLayers.Format.GeoJSON().parseFeature(message.feature);
		layer.addFeatures(feature);
	});

	bus.listen("map:setLayerParameters", function(e, message) {
		var layerId = message["layerId"];
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				var mapLayerId = mapLayers[index];
				var layer = map.getLayer(mapLayerId);
				layer.mergeNewParams(message.parameters);
			}
		}
	});

	return map;
});