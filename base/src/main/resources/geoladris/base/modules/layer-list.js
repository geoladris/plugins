define([ "jquery", "message-bus", "layer-list-selector", "i18n", "moment", "jquery-ui", "fancy-box" ], function($, bus, layerListSelector, i18n, moment) {

	var layerActions = [];
	var groupActions = [];
	var temporalLayers = [];
	var groupIdAccordionIndex = {};
	var numTopLevelGroups = 0;
	var layerGroups = {};

	bus.send("ui-accordion:create", {
		div : "all_layers",
		parentDiv : "layers_container",
		css : "layers-accordion"
	});

	layerListSelector.registerLayerPanel("all_layers_selector", 10, i18n.layers, $("#all_layers"));

	bus.listen("reset-layers", function() {
		layerActions = [];
		groupActions = [];
		temporalLayers = [];
		groupIdAccordionIndex = {};
		numTopLevelGroups = 0;

		bus.send("ui-set-content", {
			div : "all_layers",
			html : ""
		});
	});

	bus.listen("register-layer-action", function(event, action) {
		layerActions.push(action);
	});

	bus.listen("register-group-action", function(event, action) {
		groupActions.push(action);
	});

	bus.listen("add-group", function(event, groupInfo) {
		var accordion;
		if (groupInfo.parentId) {
			accordion = "all_layers_group_" + groupInfo.parentId;
		} else {
			accordion = "all_layers";
			groupIdAccordionIndex[groupInfo.id] = numTopLevelGroups;
			numTopLevelGroups++;
		}

		bus.send("ui-accordion:add-group", {
			accordion : accordion,
			id : "all_layers_group_" + groupInfo.id,
			title : groupInfo.label
		});

		bus.send("ui-add-class", {
			div : "all_layers_group_" + groupInfo.id,
			cssClass : "layer-list-accordion-content"
		});

		bus.send("ui-selectable-list:create", {
			div : "all_layers_group_" + groupInfo.id
		});

		bus.listen("ui-selectable-list:all_layers_group_" + groupInfo.id + ":item-selected", function(e, id) {
			bus.send("layer-visibility", [ id, true ]);
		});
		bus.listen("ui-selectable-list:all_layers_group_" + groupInfo.id + ":item-unselected", function(e, id) {
			bus.send("layer-visibility", [ id, false ]);
		});

		for (var i = 0; i < groupActions.length; i++) {
			$("#all_layers_group_" + groupInfo.id + "-header").append(groupActions[i](groupInfo));
		}
	});

	bus.listen("add-layer", function(event, portalLayer) {
		layerGroups[portalLayer.id] = portalLayer.groupId;

		var container = "all_layers_group_" + portalLayer.groupId;

		if (portalLayer.inlineLegendUrl != null) {
			bus.send("ui-html:create", {
				div : "layer_list_legend_" + portalLayer.id,
				parentDiv : container,
				css : "inline-legend"
			});
		} else {
			var wmsLayersWithLegend = portalLayer.mapLayers.filter(function(layer) {
				return layer.hasOwnProperty("legend");
			});
			var wmsLayerWithLegend = wmsLayersWithLegend[0];

			if (wmsLayerWithLegend) {
				bus.send("ui-button:create", {
					div : "inline-legend-button-" + portalLayer.id,
					parentDiv : container,
					css : "inline-legend-button",
					sendEventName : "open-legend",
					sendEventMessage : wmsLayerWithLegend.id
				});

				if (portalLayer.active) {
					bus.send("ui-add-class", {
						div : "inline-legend-button-" + portalLayer.id,
						cssClass : "visible"
					});
				}

				bus.listen("layer-visibility", function(event, layerId, visibility) {
					if (layerId != portalLayer.id) {
						return;
					}

					bus.send("ui-button:inline-legend-button-" + portalLayer.id + ":enable", visibility);
				});
			}
		}

		bus.send("ui-selectable-list:" + container + ":add-item", {
			id : portalLayer.id,
			text : portalLayer.label
		});
		bus.send("ui-add-class", {
			div : portalLayer.id + "-container",
			cssClass : "layer-list-layer-container"
		});
		bus.send("ui-accordion:" + container + ":visibility", {
			header : true
		});

		for (var i = 0; i < layerActions.length; i++) {
			$("#" + portalLayer.id + "-container").append(layerActions[i](portalLayer));
		}

		if (portalLayer.timestamps && portalLayer.timestamps.length > 0) {
			temporalLayers.push(portalLayer);
		}
	});

	bus.listen("layer-visibility", function(event, layerId, visible) {
		bus.send("ui-selectable-list:all_layers_group_" + layerGroups[layerId] + ":set-item", {
			id : layerId,
			selected : visible
		});
	});

	var updateLabel = function(layerId, layerFormat, date) {
		var tdLayerName = $("#" + layerId + "-container").children(".selectable-list-text");
		tdLayerName.find("span").remove();
		var format;
		if (layerFormat) {
			format = layerFormat;
		} else {
			format = "YYYY";
		}
		var dateStr = moment(date).format(format);
		$("<span/>").html(" (" + dateStr + ")").appendTo(tdLayerName);
	};

	function findClosestPrevious(layer, date) {
		var layerTimestamps = layer.timestamps;
		var layerTimestampStyles = null;
		if (layer.hasOwnProperty("timeStyles")) {
			layerTimestampStyles = layer.timeStyles.split(",");
		}
		var timestampInfos = [];
		for (var j = 0; j < layerTimestamps.length; j++) {
			var timestamp = new Date();
			timestamp.setISO8601(layerTimestamps[j]);
			var style = null;
			if (layerTimestampStyles != null) {
				style = layerTimestampStyles[j];
			}
			var timestampInfo = {
				"timestamp" : timestamp,
				"style" : style
			};
			timestampInfos.push(timestampInfo);
		}

		timestampInfos.sort(function(infoA, infoB) {
			return infoA.timestamp.getTime() - infoB.timestamp.getTime();
		});

		var closestPrevious = null;

		for (var j = 0; j < timestampInfos.length; j++) {
			var timestampInfo = timestampInfos[j];
			if (timestampInfo.timestamp.getTime() <= date.getTime()) {
				closestPrevious = timestampInfo;
			} else {
				break;
			}
		}

		if (closestPrevious == null) {
			closestPrevious = timestampInfos[0];
		}

		return closestPrevious;
	}

	bus.listen("time-slider.selection", function(event, date) {
		for (var i = 0; i < temporalLayers.length; i++) {
			var layer = temporalLayers[i];

			var closestPrevious = findClosestPrevious(layer, date);
			updateLabel(layer.id, layer["date-format"], closestPrevious.timestamp);

			bus.send("layer-timestamp-selected", [ layer.id, closestPrevious.timestamp, closestPrevious.style ]);
		}
	});
	bus.listen("layer-time-slider.selection", function(event, layerid, date) {
		$.each(temporalLayers, function(index, temporalLayer) {
			if (temporalLayer.id == layerid) {
				var closestPrevious = findClosestPrevious(temporalLayer, date);
				updateLabel(layerid, temporalLayer["date-format"], closestPrevious.timestamp);
				bus.send("layer-timestamp-selected", [ layerid, closestPrevious.timestamp, closestPrevious.style ]);
			}
		});
	});

	bus.listen("show-layer-group", function(event, groupId) {
		bus.send("ui-accordion:all_layers_group_" + groupId + ":visibility", {
			header : true,
			content : true
		});
	});
});
