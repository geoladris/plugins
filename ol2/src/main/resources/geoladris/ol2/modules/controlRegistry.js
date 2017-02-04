define([ "message-bus", "./map" ], function(bus, map) {

	var controlTypeCreatorFunction = {};
	var idControlInstance = {};

	bus.listen("map:createControl", function(e, message) {
		if (controlTypeCreatorFunction.hasOwnProperty(message.controlType)) {
			var control = controlTypeCreatorFunction[message.controlType](message);
			map.addControl(control);
			control.activate();
			idControlInstance[message.controlId] = {
				"control" : control,
				"configuration" : JSON.parse(JSON.stringify(message))
			};
		}
	});

	function checkControlId() {
		if (!idControlInstance.hasOwnProperty(message.controlId)) {
			throw "control id not found: " + message.controlId;
		}
	}

	bus.listen("map:activateControl", function(e, message) {
		checkControlId();
		var control = idControlInstance[message.controlId].control;
		if (!control.active) {
			control.activate();
		}
	});

	bus.listen("map:deactivateControl", function(e, message) {
		checkControlId();
		var control = idControlInstance[message.controlId].control;
		if (control.active) {
			control.deactivate();
		}
	});

	bus.listen("map:updateControl", function(e, message) {
		checkControlId();
		var controlConfiguration = idControlInstance[message.controlId].configuration;
		for ( var attrname in message) {
			configuration[attrname] = message[attrname];
		}
	});

	bus.listen("map:destroyControl", function(e, message) {
		checkControlId();
		var control = idControlInstance[message.controlId].control;
		if (control.active) {
			control.deactivate();
		}
		map.removeControl(control);
	});

	return {
		"registerControl" : function(controlTypeName, controlCreatorFunction) {
			controlTypeCreatorFunction[controlTypeName] = controlCreatorFunction;
		}
	}

});
