/**
 * @author Micho García
 */

'use strict';

define([ "layout", "module", "toolbar", "i18n", "jquery", "message-bus", "map", "ui/ui", "jquery-ui" ], function(layout, module, toolbar, i18n, $, bus, map, ui) {
	var dialogId = "layer-order-pane";

	// Create ui components
	ui.create("button", {
		id : "order-button",
		parent : toolbar.attr("id"),
		css : "blue_button toolbar_button",
		text : i18n["layer_order"],
		clickEventName : "ui-toggle",
		clickEventMessage : dialogId
	});

	ui.create("dialog", {
		id : dialogId,
		parent : layout.map.attr("id"),
		title : i18n["layer_order"],
		closeButton : true
	});
	var content = ui.create("div", {
		id : dialogId + "-content",
		parent : dialogId
	});

	ui.sortable(content);
	content.addEventListener("change", function() {
		var newLayersOrder = jcontent.sortable('toArray');
		for (var i = 0; i < newLayersOrder.length; i++) {
			var id = newLayersOrder[i];
			var layer = map.getLayer(id);
			if (layer) {
				map.setLayerIndex(layer, i);
				// TODO: propagate change to other modules (and persist it in
				// layers.json).
			}
		}
	});

	// Link dialog visibility and toolbar button
	bus.listen("ui-toggle", function(e, id) {
		if (id == dialogId) {
			bus.send("ui-button:order-button:toggle");
		}
	});
	bus.listen("ui-hide", function(e, id) {
		if (id == dialogId) {
			bus.send("ui-button:order-button:activate", false);
		}
	});
	bus.listen("ui-show", function(e, id) {
		if (id == dialogId) {
			bus.send("ui-button:order-button:activate", true);
		}
	});

	// Update content according to layers
	bus.listen("reset-layers", function() {
		content.innerHTML = "";
	});

	bus.listen("layers-loaded", function() {
		for ( var n in map.layers) {
			var layer = map.layers[n];
			ui.create("div", {
				id : layer.id,
				parent : dialogId + "-content",
				css : "layer-order-item",
				html : layer.name
			});
		}
	});
});
