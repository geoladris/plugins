define([ "jquery", "i18n", "message-bus", "layout" ], function($, i18n, bus, layout) {
	bus.send("ui-button:create", {
		div : "toggle_legend",
		parentDiv : layout.map.attr("id"),
		css : "blue_button",
		text : i18n["legend_button"],
		sendEventName : "toggle-legend"
	});
});