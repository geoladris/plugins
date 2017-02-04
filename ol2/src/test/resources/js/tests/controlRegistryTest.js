define([ "geoladris-tests" ], function(tests) {

	describe("control registry suite", function() {
		var bus;
		var injector;

		var control = {
			"activate" : function() {
			}
		};
		var map = {
			"addControl" : function() {
			}
		};

		beforeEach(function() {
			var initialization = tests.init("ol2", {}, {
				// paths are relative to 'modules'
				"openlayers" : "../jslib/OpenLayers/OpenLayers.debug"
			});
			injector = initialization.injector;
			bus = initialization.bus;

			injector.mock("map", map);

			spyOn(control, "activate");
			spyOn(map, "addControl");
		});

		it("Create control", function(done) {
			var fcn = function(controlRegistry) {
				controlRegistry.registerControl("mytype", function() {
					return control;
				});
				bus.send("map:createControl", {
					"controlId" : "mycontrol",
					"controlType" : "mytype"
				});
				expect(control.activate).toHaveBeenCalled();
				expect(map.addControl).toHaveBeenCalled();
				done();
			}
			injector.require([ "controlRegistry" ], fcn);

		});

	});

});
