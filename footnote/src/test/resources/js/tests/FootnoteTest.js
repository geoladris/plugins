define([ "geoladris-tests" ], function(tests) {

	describe("Footnote tests", function() {
		var bus;
		var injector;

		beforeEach(function() {
			var initialization = tests.init("footnote", {
				"footnote" : {
					"text" : "abc",
					"link" : "http://abc.com"
				}
			}, {});
			injector = initialization.injector;
			bus = initialization.bus;

			var ui = {};
			spyOn(ui, "create");
			injector.mock("i18n", {});
			injector.mock("ui/ui", ui);
		});

		it("only text and link", function(done) {
			var fcn = function(modulename) {
				expect(ui.create).toHaveBeenCalledWith("a", jasmine.objectContaining({
					"html" : "abc"
				}));
				done();
			}
			injector.require([ "footnote" ], fcn);
			bus.send("modules-initialized");
		});

	});

});
