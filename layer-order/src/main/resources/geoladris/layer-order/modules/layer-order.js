/**
 * @author Micho García
 */

'use strict';

define([ "layout", "module", "toolbar", "i18n", "jquery", "message-bus", "map", "jquery-ui", "ui/ui" ], function(layout, module, toolbar, i18n, $, bus, map) {
	var dialogId = "layer-order-pane";

	// Create ui components
	bus.send("ui-button:create", {
		div : "order-button",
		parentDiv : toolbar.attr("id"),
		css : "blue_button toolbar_button",
		text : i18n["layer_order"],
		sendEventName : "ui-toggle",
		sendEventMessage : dialogId
	});

	bus.send("ui-dialog:create", {
		div : dialogId,
		parentDiv : layout.map.attr("id"),
		title : i18n["layer_order"],
		closeButton : true
	});
	bus.send("ui-html:create", {
		div : dialogId + "-content",
		parentDiv : dialogId
	});

	var content = $("#" + dialogId + "-content");
	content.sortable({
		cursor : "move"
	});
	content.on("sortstop", function(evt, ui) {
		var newLayersOrder = content.sortable('toArray');
		for (var i = 0; i < newLayersOrder.length; i++) {
			var id = newLayersOrder[i];
			var layer = map.getLayer(id);
			if (layer) {
				map.setLayerIndex(layer, i);
				// TODO: propagate change to other modules (and persist it in layers.json).
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
		bus.send("ui-set-content", {
			div : dialogId + "-content",
			content : ""
		});
	});

	bus.listen("layers-loaded", function() {
		for ( var n in map.layers) {
			var layer = map.layers[n];
			bus.send("ui-html:create", {
				div : layer.id,
				parentDiv : dialogId + "-content",
				css : "layer-order-item",
				html : layer.name
			});
		}
	});
});
