define([ "geoladris-tests" ], function(tests) {

	describe("Footnote tests", function() {
		var bus;
		var injector;
		var ui;

		beforeEach(function() {
			var initialization = tests.init("footnote", {
				"footnote" : {
					"text" : "abc",
					"link" : "http://abc.com"
				}
			}, {});
			injector = initialization.injector;
			bus = initialization.bus;

			ui = jasmine.createSpyObj("ui", [ "create" ]);
			injector.mock("i18n", {});
			injector.mock("ui/ui", ui);
		});

		it("only text and link", function(done) {
			injector.require([ "footnote" ], function() {
				bus.send("modules-initialized");
				// expect(ui.create).toHaveBeenCalledWith("a",
				// jasmine.objectContaining({
				// "html" : "abc"
				// }));
				done();
			});
		});

	});

});
