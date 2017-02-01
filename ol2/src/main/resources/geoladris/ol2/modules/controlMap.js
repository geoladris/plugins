define([ "message-bus", "map" ], function(bus, map) {

	var controlMap = {};

	bus.listen("map:activateControl", function(e, message) {
		if (controlMap.hasOwnProperty(message.controlId)) {
			var control = controlMap[message.controlId](message);
			map.addControl(control);
			control.activate();
		}
	});

	bus.listen("map:deactivateControl", function(e, message) {
		if (controlMap.hasOwnProperty(message.controlId)) {
			var control = controlMap[message.controlId](message);
			control.deactivate();
			map.addControl(control);
		}
	});

	return {
		"registerControl" : function(id, controlCreatorFunction) {
			controlMap[id] = controlCreatorFunction;
		}
	}

});
