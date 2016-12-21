define([ "jquery", "i18n", "customization", "message-bus", "layout", "ui/ui" ], function($, i18n, customization, bus, layout) {

	/*
	 * keep the information about layer legends that will be necessary when they
	 * become visible
	 */
	var legendArrayInfo = {};

	var dialogId = "legend_panel";
	var divContent = null;

	bus.send("ui-dialog:create", {
		div : dialogId,
		parentDiv : layout.map.attr("id"),
		title : i18n["legend_button"],
		closeButton : true
	});

	bus.send("ui-html:create", {
		div : dialogId + "_content",
		parentDiv : dialogId
	});

	var refreshLegendArray = function(legendArray) {
		bus.send("ui-set-content", {
			div : dialogId + "_content",
			html : ""
		});

		for (var i = 0; i < legendArray.length; i++) {
			var legendInfo = legendArray[i];
			if (!legendInfo.visibility) {
				continue;
			}

			var id = dialogId + legendInfo.id;
			bus.send("ui-html:create", {
				div : id + "_container",
				parentDiv : dialogId + "_content",
				css : "layer_legend_container"
			});
			bus.send("ui-html:create", {
				div : id + "_header",
				parentDiv : id + "_container",

				css : "layer_legend_header"
			});
			bus.send("ui-html:create", {
				div : id + "_layer_name",
				parentDiv : id + "_header",
				html : legendInfo.label,
				css : "layer_legend_name"
			});

			if (typeof legendInfo["sourceLink"] != "undefined" && typeof legendInfo["sourceLabel"] != "undefined") {
				bus.send("ui-html:create", {
					div : id + "_source_label",
					parentDiv : id + "_header",
					html : i18n["data_source"] + ": ",
					css : "layer_legend_source_label"
				});
				bus.send("ui-button:create", {
					div : id + "_source_link",
					parentDiv : id + "_header",
					text : legendInfo.sourceLabel,
					css : "layer_legend_source_link",
					sendEventName : "ui-open-url",
					sendEventMessage : {
						url : legendInfo.sourceLink,
						target : "_blank"
					}
				});
			}
			bus.send("ui-html:create", {
				div : id + "_img",
				parentDiv : id + "_container",
				css : "legend_image",
			});

			var url = legendInfo.legendUrl;
			if (legendInfo.timeDependent && legendInfo.timestamp) {
				url = url + "&STYLE=" + legendInfo.timestyle + "&TIME=" + legendInfo.timestamp.toISO8601String();
			}
			bus.send("ui-html:create", {
				div : id + "_img",
				parentDiv : id + "_container",
				css : "legend_image",
				html : "<img src='" + url + "'>"
			});
		}
	}

	bus.listen("open-legend", function(event, layerId) {
		bus.send("ui-show", dialogId);
	});

	bus.listen("toggle-legend", function() {
		bus.send("ui-toggle", dialogId);
	});

	bus.listen("reset-layers", function() {
		legendArrayInfo = {};
	});

	bus.listen("add-layer", function(event, layerInfo) {
		var legendArray = [];
		$.each(layerInfo.mapLayers, function(index, mapLayer) {
			if (mapLayer.hasOwnProperty("legend")) {
				legendArray.push({
					id : mapLayer.id,
					label : mapLayer.label,
					legendUrl : mapLayer.legendURL,
					sourceLink : mapLayer.sourceLink,
					sourceLabel : mapLayer.sourceLabel,
					visibility : layerInfo.active,
					timeDependent : layerInfo.hasOwnProperty("timeStyles")
				});
			}
		});
		if (legendArray.length > 0) {
			legendArrayInfo[layerInfo.id] = legendArray;
		}
	});

	bus.listen("layer-timestamp-selected", function(e, layerId, d, style) {
		var legendArray = legendArrayInfo[layerId];
		if (legendArray) {
			$.each(legendArray, function(index, legendInfo) {
				if (legendInfo.timeDependent) {
					legendInfo["timestamp"] = d;
					legendInfo["timestyle"] = style
				}
			});

			refreshLegendArray(legendArray);
		}
	});

	bus.listen("layer-visibility", function(event, layerId, visibility) {
		var legendArray = legendArrayInfo[layerId] || [];
		$.each(legendArray, function(index, legendInfo) {
			legendInfo["visibility"] = visibility;
		});

		refreshLegendArray(legendArray);
	});

});