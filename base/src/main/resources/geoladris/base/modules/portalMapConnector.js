define([ "message-bus" ], function(bus) {

	var currentControlIds = [];
	var defaultExclusiveControl = [];

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

	var queriableLayers = {};

	var activateExclusiveControl = function(controlIds) {
		for (var i = 0; i < currentControlIds.length; i++) {
			bus.send("map:deactivateControl", {
				"controlId" : currentControlIds[i]
			});
		}

		for (var i = 0; i < controlIds.length; i++) {
			bus.send("map:activateControl", {
				"controlId" : controlIds[i]
			});
		}

		currentControlIds = controlIds;
	};

	bus.listen("activate-default-exclusive-control", function(event) {
		activateExclusiveControl(defaultExclusiveControl);
	});

	bus.listen("activate-exclusive-control", function(event, control) {
		if (!control) {
			control = [];
		} else if (!isArray(control)) {
			control = [ control ];
		}
		var controlIds = [];
		for (var i = 0; i < control.length; i++) {
			var controlInfo = control[i];
			bus.send("map:createControl", controlInfo);
			controlIds.push(controlInfo.controlId);
		}
		activateExclusiveControl(controlIds);
	});

	bus.listen("modules-loaded", function(e, message) {
		bus.send("map:activateControl", {
			"controlType" : "navigation"
		});
		bus.send("map:activateControl", {
			"controlType" : "scale"
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
			} else {
				wmsInfo = {
					"baseUrl" : mapLayer.baseUrl,
					"wmsName" : mapLayer.wmsName
				}
				if (mapLayer.imageFormat) {
					wmsInfo["imageFormat"] = mapLayer.imageFormat;
				}
				mapAddLayerEvent["wms"] = wmsInfo;
			}

			/*
			 * We prepare the event to install the info control associated with
			 * the layer. We listen map:layerAdded in order to install the
			 * control
			 */
			var queryInfo = null;
			if (mapLayer.queryType == "wfs") {
				queryInfo = {
					"controlId" : mapLayer.id,
					"controlType" : "wfsinfo",
					"url" : mapLayer.queryUrl,
					"wfsName" : mapLayer.wmsName,
					"fieldNames" : mapLayer.queryFieldNames,
					"geomFieldName" : mapLayer.queryGeomFieldName,
					"timeFieldName" : mapLayer.queryTimeFieldName
				}
			} else if (mapLayer.queryType == "wms") {
				queryInfo = {
					"controlId" : mapLayer.id,
					"controlType" : "wmsinfo",
					"queryUrl" : mapLayer.queryUrl,
					"layerUrl" : mapLayer.baseUrl,
					"highlightBounds" : mapLayer.queryHighlightBounds
				}

			}
			if (queryInfo != null) {
				tempMapLayerQueryInfo[mapLayer.id] = queryInfo;
				queriableLayers[mapLayer.id] = true;
			}

			zIndexes[mapLayer.zIndex] = mapAddLayerEvent;
			mapLayerArray.push(mapLayer.id);
		}
		if (mapLayerArray.length > 0) {
			mapLayersByLayerId[layerInfo.id] = mapLayerArray;
		}
	});

	bus.listen("map:layerAdded", function(e, message) {
		/*
		 * Install the info control if we have queryInfo for it, built in
		 * add-layer listener
		 */
		var queryInfo = tempMapLayerQueryInfo[message.layerId];
		if (queryInfo) {
			bus.send("map:createControl", queryInfo);
			defaultExclusiveControl.push(queryInfo.controlId);
		}
		// We just need the information between add-layer and map:layerAdded
		// events
		delete tempMapLayerQueryInfo[message.layerId];
	});

	bus.listen("layers-loaded", function(e) {
		// Add the layers in the right zindex order
		var sortedZIndices = Object.keys(zIndexes).sort(function(a, b) {
			return a - b;
		});

		for (var i = 0; i < sortedZIndices.length; i++) {
			var zIndex = sortedZIndices[i];
			var mapAddLayerEvent = zIndexes[zIndex];
			bus.send("map:addLayer", mapAddLayerEvent);
		}
	});

	bus.listen("reset-layers", function() {
		for ( var layerId in mapLayersByLayerId) {
			var mapLayerIds = mapLayersByLayerId[layerId];
			for (var i = 0; i < mapLayerIds.length; i++) {
				mapLayerId = mapLayerIds[i];
				if (queriableLayers.hasOwnProperty(mapLayerId)){
					bus.send("map:destroyControl", {
						"controlId" : mapLayerId
					});
				}
			}
		}
		defaultExclusiveControl = [];
		currentControlIds = [];
		
		mapLayersByLayerId = {};
		zIndexes = {};
		bus.send("map:removeAllLayers");
	});

	bus.listen("layer-visibility", function(event, layerId, visibility) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				// disable layer at the map level
				var mapLayerId = mapLayers[index];
				bus.send("map:layerVisibility", {
					"layerId" : mapLayerId,
					"visibility" : visibility
				});

				if (queriableLayers.hasOwnProperty(mapLayerId)) {
					// Enable/Disable info control
					bus.send(visibility ? "map:activateControl" : "map:deactivateControl", {
						"controlId" : mapLayerId
					});
				}
			}
		}
	});

	bus.listen("layer-timestamp-selected", function(e, layerId, timestamp) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				bus.send("map:updateControl", {
					"controlId" : mapLayers[index],
					"timestamp" : timestamp
				});
			}
		}
	});

});