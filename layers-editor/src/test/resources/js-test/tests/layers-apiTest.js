describe("layers-api", function() {

	var injector;
	var bus;
	var customization;
	var module;

	beforeEach(function(done) {
		require.config({
			"baseUrl" : "src/",
			"paths" : {
				"message-bus" : "/core-modules/message-bus",
				"jquery" : "/core-jslib/jquery-2.1.0"
			},
			"config" : {}
		});
		require([ "/test-jslib/Squire.js" ], function(Squire) {
			if (injector != null) {
				injector.clean();
				injector.remove();
			}
			injector = new Squire();
			injector.require([ "message-bus" ], function(loadedModule) {
				bus = loadedModule;
				done();
			});

			injector.mock("customization", {
				languageCode : "fr"
			});
		});
	});

	it("remove layer in second level", function(done) {
		var root = {
			"default-server" : "http://demo1.geo-solutions.it",
			"wmsLayers" : [ {
				"id" : "blue-marble",
				"baseUrl" : "http://rdc-snsf.org/diss_geoserver/wms",
				"wmsName" : "unredd:blue_marble",
				"imageFormat" : "image/jpeg"
			} ],
			"portalLayers" : [ {
				"id" : "blue-marble",
				"label" : "Blue marble",
				"layers" : [ "blue-marble" ]
			} ],
			"groups" : [ {
				"id" : "base",
				"label" : "Base",
				"items" : [ {
					"id" : "innerbase",
					"label" : "General purpose",
					"items" : [ "blue-marble" ]
				} ]
			} ]
		}

		injector.require([ "layers-api" ], function(api) {
			bus.send("layers-loaded", root);
			var layer = api.getPortalLayer("blue-marble");
			if (layer != null) { // to ignore reentering calls
				api.removePortalLayer(layer.id);
				var group = api.getGroup("innerbase");
				expect(group.items.length).toBe(0);
				done();
			}
		});
	});
});