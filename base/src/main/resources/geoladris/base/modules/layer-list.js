define([ "jquery", "message-bus", "layer-list-selector", "i18n", "moment", "ui/ui", "jquery-ui", "fancy-box" ], function($, bus, layerListSelector, i18n, moment, ui) {

	var layerActions = [];
	var groupActions = [];
	var temporalLayers = [];
	var groupIdAccordionIndex = {};
	var numTopLevelGroups = 0;
	var layerGroups = {};

	var allLayers = ui.create("div", {
		id : "all_layers",
		parent : "layers_container",
		css : "layers-accordion"
	});

	layerListSelector.registerLayerPanel("all_layers_selector", 10, i18n.layers, $("#all_layers"));

	bus.listen("reset-layers", function() {
		layerActions = [];
		groupActions = [];
		temporalLayers = [];
		groupIdAccordionIndex = {};
		numTopLevelGroups = 0;
		allLayers.innerHTML = "";
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

		ui.create("accordion-group", {
			id : "all_layers_group_" + groupInfo.id,
			parent : accordion,
			css : "layer-list-accordion-content",
			title : groupInfo.label
		});

		for (var i = 0; i < groupActions.length; i++) {
			$("#all_layers_group_" + groupInfo.id + "-header").append(groupActions[i](groupInfo));
		}
	});

	bus.listen("add-layer", function(event, portalLayer) {
		layerGroups[portalLayer.id] = portalLayer.groupId;

		var parent = "all_layers_group_" + portalLayer.groupId;

		if (portalLayer.inlineLegendUrl != null) {
			ui.create("div", {
				id : "layer_list_legend_" + portalLayer.id,
				parent : parent,
				css : "inline-legend"
			});
		} else {
			var wmsLayersWithLegend = portalLayer.mapLayers.filter(function(layer) {
				return layer.hasOwnProperty("legend");
			});
			var wmsLayerWithLegend = wmsLayersWithLegend[0];
			if (wmsLayerWithLegend) {
				ui.create("button", {
					id : "inline-legend-button-" + portalLayer.id,
					parent : parent,
					css : portalLayer.active ? "inline-legend-button visible" : "inline-legend-button",
					clickEventName : "open-legend",
					clickEventMessage : wmsLayerWithLegend.id
				});

			}
		}

		var checkbox = ui.create("checkbox", {
			id : portalLayer.id,
			parent : parent,
			text : portalLayer.label
		});
		checkbox.addEventListener("input", function() {
			bus.send("layer-visibility", [ this.id, this.checked]);
		});

		bus.send("ui-accordion-group:" + parent + ":visibility", {
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
		bus.send("ui-button:inline-legend-button-" + layerId + ":enable", visible);
		document.getElementById(layerId).checked = visible;
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
		bus.send("ui-accordion-group:all_layers_group_" + groupId + ":visibility", {
			header : true,
			content : true
		});
	});
});
