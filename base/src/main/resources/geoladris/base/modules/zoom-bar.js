define([ "jquery", "message-bus", "layout" ], function($, bus, layout) {
	bus.send("ui-button:create", {
		div : "zoom_out",
		parentDiv : layout.map.attr("id"),
		sendEventName : "zoom-out"
	});
	bus.send("ui-button:create", {
		div : "zoom_in",
		parentDiv : layout.map.attr("id"),
		sendEventName : "zoom-in"
	});
	bus.send("ui-button:create", {
		div : "zoom_to_max_extent",
		parentDiv : layout.map.attr("id"),
		sendEventName : "initial-zoom"
	});
});
