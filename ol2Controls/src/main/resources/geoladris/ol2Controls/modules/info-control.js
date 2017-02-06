define([ "ol2/map", "message-bus", "customization", "ol2/controlRegistry", "openlayers", "jquery" ], function(map, bus, customization,
		controlRegistry) {

	// Associates wmsLayers with controls
	var layerIdControl = {};

	// Associates portalLayers with the selected timestamps
	var layerIdInfo = {};

	// List of controls
	var controls = [];

	var addBoundsAndHighlightGeom = function(feature) {
		var bounds = null;
		var highlightGeom = null;

		if (feature.geometry) {
			bounds = feature["geometry"].getBounds();
			highlightGeom = feature["geometry"];
		} else if (feature.attributes["bbox"]) {
			var bbox = feature.attributes["bbox"];
			bounds = new OpenLayers.Bounds();
			bounds.extend(new OpenLayers.LonLat(bbox[0], bbox[1]));
			bounds.extend(new OpenLayers.LonLat(bbox[2], bbox[3]));
			highlightGeom = bounds.toGeometry();
		}

		feature["bounds"] = bounds;
		feature["highlightGeom"] = highlightGeom;
	};

	bus.listen("reset-layers", function() {
		layerIdControl = {};
		layerIdInfo = {};
		bus.send("set-default-exclusive-control", []);
		bus.send("activate-default-exclusive-control");
		for ( var c in controls) {
			var control = controls[c];
			control.destroy();
		}
		controls = [];
	});

	function sendInfoFeatures(layerId, features, x, y) {
		var mapPoint = map.getLonLatFromPixel({
			"x" : x,
			"y" : y
		});
		bus.send("info-features", [ layerId, features, x, y, {
			"x" : mapPoint.lon,
			"y" : mapPoint.lat
		} ]);
	}

	controlRegistry.registerControl("wfsinfo", function(queryInfo) {
		var queryUrl = queryInfo.url;
		queryUrl = queryUrl.trim();
		queryUrl = queryUrl.replace(/wms$/, "wfs");
		queryUrl = queryUrl + "?request=GetFeature&service=wfs&" + //
		"version=1.0.0&outputFormat=application/json&srsName=EPSG:900913&" + //
		"typeName=" + queryInfo.wfsName + "&propertyName=" + queryInfo.fieldNames.join(",");

		var wfsCallControl = null;

		control = new OpenLayers.Control();
		control.handler = new OpenLayers.Handler.Click(control, {
			'click' : function(e) {
				// bbox parameter
				var tolerance = 5;
				var point1 = map.getLonLatFromPixel(e.xy.offset({
					x : -tolerance,
					y : -tolerance
				}));
				var point2 = map.getLonLatFromPixel(e.xy.offset({
					x : tolerance,
					y : tolerance
				}));
				var bboxFilter = //
				"  <ogc:Intersects>" + //
				"    <ogc:PropertyName>" + queryInfo.geomFieldName + "</ogc:PropertyName>" + //
				"    <gml:Box xmlns:gml=\"http://www.opengis.net/gml\" srsName=\"EPSG:900913\">" + //
				"      <gml:coordinates decimal=\".\" cs=\",\" ts=\" \">" + (point1.lon) + "," + (point1.lat) + " " + (point2.lon) + ","
						+ (point2.lat) + "</gml:coordinates>" + //
						"    </gml:Box>" + //
						"  </ogc:Intersects>" //

						// time parameter
				var getFeatureMessage = "<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\">";
				if (queryInfo.hasOwnProperty("timestamp")) {
					getFeatureMessage += //
					"  <ogc:And>" + //
					"" + bboxFilter + //
					"    <ogc:PropertyIsEqualTo>" + //
					"      <ogc:PropertyName>" + queryInfo.timeFieldName + "</ogc:PropertyName>" + //
					"      <ogc:Function name=\"dateParse\">" + //
					"        <ogc:Literal>yyyy-MM-dd</ogc:Literal>" + //
					"        <ogc:Literal>" + queryInfo.timestamp.toISO8601String() + "</ogc:Literal>" + //
					"      </ogc:Function>" + //
					"    </ogc:PropertyIsEqualTo>" + //
					"  </ogc:And>";
				} else {
					getFeatureMessage += bboxFilter;
				}
				getFeatureMessage += "</ogc:Filter>";
				var url = queryUrl + "&FILTER=" + encodeURIComponent(getFeatureMessage);

				if (wfsCallControl != null) {
					wfsCallControl.abort();
				}
				bus.send("clear-info-features");

				bus.send("ajax", {
					dataType : "json",
					url : "proxy",
					data : $.param({
						url : url
					}),
					success : function(data, textStatus, jqXHR) {
						var features = new OpenLayers.Format.GeoJSON().read(data);
						var geojsonFeatures = [];
						if (features.length > 0) {
							$.each(features, function(index, feature) {
								addBoundsAndHighlightGeom(feature);
								var geojsonFeature = JSON.parse(new OpenLayers.Format.GeoJSON().write(feature));
								geojsonFeature["bounds"] = feature["bounds"];
								geojsonFeature["highlightGeom"] = feature["highlightGeom"];
								geojsonFeatures.push(geojsonFeature);
							});

							sendInfoFeatures(queryInfo.eventData, geojsonFeatures, e.xy.x, e.xy.y);
						}
					},
					controlCallBack : function(control) {
						wfsCallControl = control;
					},
					errorMsg : "Cannot get info for layer " + queryInfo.label
				});

			}
		});

		return control;
	});

	controlRegistry.registerControl("wmsinfo", function(queryInfo) {
		var lastXY = null;

		var url = queryInfo.layerUrl;
		if (url instanceof Array) {
			url = url[0];
		}

		var control = new OpenLayers.Control.WMSGetFeatureInfo({
			url : queryInfo.queryUrl,
			layerUrls : [ url ],
			title : 'Identify features by clicking',
			infoFormat : 'application/vnd.ogc.gml',
			drillDown : false,
			queryVisible : true,
			maxFeatures : 5,
			handlerOptions : {
				"click" : {
					'single' : true,
					'double' : false
				}
			},
			eventListeners : {
				getfeatureinfo : function(evt) {
					if (evt.features && evt.features.length > 0 && lastXY.x == evt.xy.x && lastXY.y == evt.xy.y) {
						var features = evt.features;

						// re-project to Google projection
						epsg4326 = new OpenLayers.Projection("EPSG:4326");
						epsg900913 = new OpenLayers.Projection("EPSG:900913");
						var geojsonFeatures = [];
						$.each(evt.features, function(index, feature) {
							if (feature.geometry) {
								if (mapLayer.queryHighlightBounds) {
									feature.geometry = feature.geometry.getBounds().toGeometry();
								}
								feature.geometry.transform(epsg4326, epsg900913);
							}
							addBoundsAndHighlightGeom(feature);
							var geojsonFeature = JSON.parse(new OpenLayers.Format.GeoJSON().write(feature));
							geojsonFeature["bounds"] = feature["bounds"];
							geojsonFeature["highlightGeom"] = feature["highlightGeom"];
							geojsonFeatures.push(geojsonFeature);
						});

						sendInfoFeatures(queryInfo.eventData, geojsonFeatures, evt.xy.x, evt.xy.y);
					}
				},
				beforegetfeatureinfo : function(event) {
					lastXY = event.xy;
					var id = mapLayer.id;
					if (queryInfo.hasOwnProperty("timestamp")) {
						control.vendorParams = {
							"time" : queryInfo["timestamp"].toISO8601String()
						};
					}

					bus.send("clear-info-features");
				}
			},
			formatOptions : {
				typeName : 'XXX',
				featureNS : 'http://www.openplans.org/unredd'
			}
		});

		var layer = map.getLayer(queryInfo.layerId);
		control.layers = new Array();
		control.layers.push(layer);

		return control;
	});

});
