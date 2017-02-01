define([ "message-bus" ], function(bus) {

	var currentControlList = [];
	var defaultExclusiveControl = null;

	/*
	 * Stores the indices during the layer load in order to set the right order
	 * when all add-layer events are issued at start up
	 */
	var zIndexes = {};
	/*
	 * keep the information about wms layers that will be necessary for
	 * visibility, opacity, etc.
	 */
	var mapLayersByLayerId = {};

	var activateExclusiveControl = function(controlList) {
		for (var i = 0; i < currentControlList.length; i++) {
			currentControlList[i].deactivate();
			map.removeControl(currentControlList[i]);
		}

		for (var i = 0; i < controlList.length; i++) {
			map.addControl(controlList[i]);
			controlList[i].activate();
		}

		currentControlList = controlList;
	};

	bus.listen("activate-default-exclusive-control", function(event) {
		activateExclusiveControl(defaultExclusiveControl);
	});

	bus.listen("set-default-exclusive-control", function(event, control) {
		if (!control) {
			control = [];
		} else if (!isArray(control)) {
			control = [ control ];
		}
		defaultExclusiveControl = control;
	});

	bus.listen("activate-exclusive-control", function(event, control) {
		if (!control) {
			control = [];
		} else if (!isArray(control)) {
			control = [ control ];
		}
		activateExclusiveControl(control);
	});

	bus.listen("modules-loaded", function(e, message) {
		bus.send("map:activateControls", {
			"controlIds" : [ "navigation", "scale" ]
		});
	});

	var tempMapLayerQueryInfo = {}

	bus.listen("add-layer", function(e, layerInfo) {
		var mapLayerArray = [];
		for (var index = 0; index < layerInfo.mapLayers.length; index++) {
			var mapLayer = layerInfo.mapLayers[index];
			var mapAddLayerEvent = {
				"layerId" : mapLayer.id,
				"enabled" : false
			// enabled later by visibility events
			};
			if (mapLayer.type == "osm") {
				mapAddLayerEvent["osm"] = {
					"osmUrls" : mapLayer.osmUrls
				};
			} else if (mapLayer.type == "gmaps") {
				mapAddLayerEvent["gmaps"] = {
					"gmaps-type" : mapLayer["gmaps-type"]
				};
			} else if (mapLayer.type == "wfs") {
				mapAddLayerEvent["wfs"] = {
					"baseUrl" : mapLayer.baseUrl,
					"wmsName" : mapLayer.wmsName
				};
			} else if (mapLayer.type == "wms") {
				mapAddLayerEvent["wms"] = {
					"baseUrl" : mapLayer.baseUrl,
					"wmsName" : mapLayer.wmsName,
					"imageFormat" : mapLayer.imageFormat
				};
			}

			var queryInfo = null;
			if (mapLayer.queryType == "wfs") {
				queryInfo = {
					"controlId" : "wfsinfo",
					"url" : mapLayer.queryUrl,
					"wfsName" : mapLayer.wmsName,
					"fieldNames" : mapLayer.queryFieldNames,
					"geomFieldName" : mapLayer.queryGeomFieldName,
					"timeFieldName" : mapLayer.queryTimeFieldName
				}
			} else if (mapLayer.queryType == "wms") {
				queryInfo = {
					"controlId" : "wmsinfo",
					"highlightBounds" : mapLayer.queryHighlightBounds
				}

			}
			if (queryInfo != null) {
				tempMapLayerQueryInfo[mapLayer.id] = queryInfo;
			}

			zIndexes[mapLayer.id] = mapAddLayerEvent;
			mapLayerArray.push(mapLayer.id);
		}
		if (mapLayerArray.length > 0) {
			mapLayersByLayerId[layerInfo.id] = mapLayerArray;
		}
	});

	bus.listen("map:layerAdded", function(e, message) {
		var queryInfo = tempMapLayerQueryInfo[message.layerId];

		// We just need the information between add-layer and map:layerAdded
		// events
		delete tempMapLayerQueryInfo[message.layerId];

		bus.send("map:activateControl", queryInfo);
	});
	bus.listen("layers-loaded", function(e) {
		// Add the layers in the right zindex order
		var sorted = Object.keys(zIndexes).sort(function(a, b) {
			return zIndexes[a] - zIndexes[b]
		});

		for (var i = 0; i < sorted.length; i++) {
			var id = sorted[i];
			var mapAddLayerEvent = zIndexes[id];
			bus.send("map:addLayer", mapAddLayerEvent);
		}
	});

	bus.listen("reset-layers", function() {
		mapLayersByLayerId = {};
		zIndexes = {};
		bus.send("map:removeAllLayers");
	});

	bus.listen("layer-visibility", function(event, layerId, visibility) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				var mapLayerId = mapLayers[index];
				bus.send("map:layerVisibility", {
					"layerId" : mapLayerId,
					"visibility" : visibility
				});
			}
			;
		}
	});

});