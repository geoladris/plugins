define([ "geoladris-tests" ], function(tests) {
	describe("save-button", function() {
		var api = {
			get : function() {
				return {};
			}
		};
		var toolbar;
		var i18n = {
			"layers-editor.save_layers" : "Save my layers!",
			"layers-editor.error_saving" : "Could not save them!"
		};

		beforeEach(function() {
			tests.init({});

			toolbar = $("<div/>").attr("id", "toolbar");
			$("body").append(toolbar);
			injector.mock("toolbar", toolbar);

			injector.mock("./layers-api", api);
			injector.mock("i18n", i18n);
		});

		afterEach(function() {
			$("#toolbar").remove();
		});

		it("creates a button", function(done) {
			injector.require([ "save-button" ], function(saveButton) {
				var button = $("#save-layers-button");
				expect(button.length).toBe(1);
				expect(button.parent().attr("id")).toBe("toolbar");
				expect(button.hasClass("blue_button")).toBe(true);
				expect(button.hasClass("toolbar_button")).toBe(true);
				expect(button.html()).toBe(i18n["layers-editor.save_layers"]);

				done();
			});
		});

		it("sends ajax on click", function(done) {
			injector.require([ "save-button" ], function(saveButton) {
				var button = $("#save-layers-button");
				button.click();
				expect(bus.send).toHaveBeenCalledWith("ajax", jasmine.objectContaining({
					type : 'PUT',
					url : 'layers.json',
					contentType : "application/json; charset=utf-8",
					errorMsg : i18n["layers-editor.error_saving"]
				}));

				done();
			});
		});
	});
});