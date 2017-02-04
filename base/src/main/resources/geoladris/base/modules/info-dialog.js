define([ "module", "jquery", "message-bus", "map", "i18n", "customization", "ui/ui", "highcharts", "highcharts-theme-sand" ], function(module, $, bus, map, i18n, customization, ui) {
	var wmsLayerInfo = {};
	var infoFeatures = {};

	var pointHighlightLayer = null;

	var dialog;

	bus.listen("reset-layers", function() {
		wmsLayerInfo = {};
	});

	bus.listen("add-layer", function(event, layerInfo) {
		var portalLayerName = layerInfo.label;
		$.each(layerInfo.mapLayers, function(i, mapLayer) {
			wmsLayerInfo[mapLayer.id] = {
				"portalLayerName" : portalLayerName,
				"wmsName" : mapLayer.wmsName
			}
		});
	});

	bus.listen("clear-info-features", function(event, features, x, y) {
		if (dialog) {
			dialog.innerHTML = "";
		}

		infoFeatures = {};
		if (pointHighlightLayer != null) {
			pointHighlightLayer.removeAllFeatures();
			map.removeLayer(pointHighlightLayer);
			pointHighlightLayer = null;
		}
	});

	bus.listen("info-features", function(event, wmsLayerId, features, x, y) {
		if (pointHighlightLayer == null) {
			var styles = new OpenLayers.StyleMap({
				"default" : {
					graphicName : "cross",
					pointRadius : 10,
					strokeWidth : 1,
					strokeColor : "#000000",
					fillOpacity : 0.6,
					fillColor : "#ee4400"
				}
			});

			pointHighlightLayer = new OpenLayers.Layer.Vector("point highlight layer", {
				styleMap : styles
			});
			pointHighlightLayer.id = "info-point-highlight-layer";
			map.addLayer(pointHighlightLayer);
		}
		var mapPoint = map.getLonLatFromPixel({
			"x" : x,
			"y" : y
		});
		var layerFeatures = pointHighlightLayer.features;
		var alreadyInLayer = false;
		for (var i = 0; i < layerFeatures.length; i++) {
			if (layerFeatures[i].geometry.x == mapPoint.lon && layerFeatures[i].geometry.y == mapPoint.lat) {
				alreadyInLayer = true;
			}
		}
		if (!alreadyInLayer) {
			var pointFeature = new OpenLayers.Feature.Vector();
			pointFeature.geometry = new OpenLayers.Geometry.Point(mapPoint.lon, mapPoint.lat);
			pointHighlightLayer.addFeatures(pointFeature);
		}

		infoFeatures[wmsLayerId] = features;

		dialog = ui.create("dialog", {
			id : "info_popup",
			parent : document.body,
			title : i18n["info_dialog_title"],
			closeButton : true,
		});

		bus.listen("ui-hide", function(event, id) {
			if (id == "info_popup") {
				bus.send("clear-info-features");
				bus.send("clear-highlighted-features");
				map.getLayer("Highlighted Features").destroyFeatures();
			}
		});

		// TODO check if there is a custom pop up instead of showing the
		// standard one
		var divResults = ui.create("div", {
			id : "result_area_" + wmsLayerId,
			parent : dialog
		});

		ui.create("div", {
			parent : divResults,
			css : "layer_title_info_center"
		});

		var tableContainer = ui.create("div", {
			parent : divResults,
			css : "layer_title_info_center"
		});

		var table = ui.create("table", {
			parent : tableContainer
		});

		var tr = ui.create("tr", {
			parent : table,
			html : "<th class='command'><th class='command'>"
		});

		var layerNameFeatures = null;
		var layerName = wmsLayerInfo[wmsLayerId]["portalLayerName"];

		var aliases = features[0]["aliases"];
		for (var i = 0; i < aliases.length; i++) {
			ui.create("th", {
				parent : tr,
				css : "data",
				html : aliases[i].alias
			})
		}

		$.each(features, function(index, feature) {
			var tr = ui.create("tr", {
				parent : table
			});

			// Zoom to object button
			var tdMagnifier = ui.create("td", {
				parent : tr,
				css : "command"
			});

			if (feature["bounds"] != null) {
				ui.create("button", {
					id : "info-magnifier-" + wmsLayerId + "-" + index,
					css : "info-magnifier",
					parent : tdMagnifier,
					image : "modules/images/zoom-to-object.png",
					clickEventName : "zoom-to",
					clickEventMessage : new OpenLayers.Bounds([ feature["bounds"].scale(1.2).toArray() ])
				});
			}

			// Indicators button
			var tdIndicator = ui.create("td", {
				id : "info-indicator-" + wmsLayerId + "-" + index,
				parent : tr,
				css : "command"
			});
			var imgWait = ui.create("img", {
				parent : tdIndicator
			});
			imgWait.src = "styles/images/ajax-loader.gif";
			imgWait.alt = "wait";

			var wmsName = wmsLayerInfo[wmsLayerId]["wmsName"];
			bus.send("ajax", {
				url : 'indicators?layerId=' + wmsName,
				success : function(indicators, textStatus, jqXHR) {
					if (indicators.length > 0) {
						bus.send("feature-indicators-received", [ wmsName, wmsLayerId, index, indicators ]);
					}
				},
				errorMsg : "Could not obtain the indicator",
				complete : function() {
					$(imgWait).remove();
				}
			});

			var aliases = feature["aliases"];
			for (var i = 0; i < aliases.length; i++) {
				ui.create("td", {
					parent : tr,
					css : "data",
					html : feature.attributes[aliases[i].name]
				})
			}

			if (feature["highlightGeom"] != null) {
				$(tr).mouseenter(function() {
					bus.send("highlight-feature", feature["highlightGeom"]);
				});
				$(tr).mouseleave(function() {
					bus.send("clear-highlighted-features");
				});
			}

		});

		// If no features selected then close the dialog
		if (features.length === 0) {
			bus.send("ui-hide", "info_popup");
		} else {
			bus.send("ui-show", "info_popup");
		}

		bus.listen("hide-info-features", function() {
			bus.send("ui-hide", "info_popup");
		});
	});

	bus.listen("feature-indicators-received", function(event, wmsName, wmsLayerId, infoFeatureIndex, indicators) {
		infoFeatures[wmsLayerId][infoFeatureIndex]["indicators"] = indicators;
		// TODO if there is more than one indicator, offer the
		// choice to the user.
		$(indicators).each(function(indicatorIndex, indicator) {
			// Muestra un icono para cada grafico con el
			// texto alternativo con el titulo del grafico.
			var button = ui.create("button", {
				id : "info-indicator-" + wmsLayerId + "-" + infoFeatureIndex + "-" + indicatorIndex,
				parent : "info-indicator-" + wmsLayerId + "-" + infoFeatureIndex,
				image : "modules/images/object-indicators.png",
				clickEventName : "show-feature-indicator",
				clickEventMessage : [ wmsName, wmsLayerId, infoFeatureIndex, indicatorIndex ]
			});
			button.alt = indicator.title;
			button.title = indicator.title;
			// TODO Agregar separador entre iconos.
		});// END each
	})

	bus.listen("show-feature-indicator", function(event, wmsName, wmsLayerId, featureIndex, indicatorIndex) {
		var feature = infoFeatures[wmsLayerId][featureIndex];
		var indicator = feature["indicators"][indicatorIndex];

		bus.send("ajax", {
			url : "indicator?objectId=" + feature.attributes[indicator.idField] + //
			"&objectName=" + feature.attributes[indicator.nameField] + //
			"&layerId=" + wmsName + //
			"&indicatorId=" + indicator.id,
			success : function(chartData, textStatus, jqXHR) {
				var chart = $("<div/>");
				chart.highcharts(chartData);
				bus.send("show-info", [ indicator.title, chart[0] ]);
			},
			errorMsg : "Could not obtain the indicator"
		});

	});

	bus.listen("highlight-feature", function(event, geometry) {
		var highlightLayer = map.getLayer("Highlighted Features");
		highlightLayer.removeAllFeatures();
		var feature = new OpenLayers.Feature.Vector();
		feature.geometry = geometry;
		highlightLayer.addFeatures(feature);
		highlightLayer.redraw();
	});

	bus.listen("clear-highlighted-features", function() {
		var highlightLayer = map.getLayer("Highlighted Features");
		highlightLayer.removeAllFeatures();
		highlightLayer.redraw();
	});
});