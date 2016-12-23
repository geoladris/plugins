define([ "Squire", "message-bus" ], function(s, b) {
	// project basedir relative to the directory where karma.conf.js is
	// contained; useful for RequireJS paths below
	var root = "../../../../../../";

	// Plugin dependant options
	var PLUGIN_NAME = "layers-editor";
	var REQUIRE_JS_PATHS = {
		"jquery" : root + "target/unpacked-core/geoladris/core/jslib/jquery-2.1.0",
		"message-bus" : root + "target/unpacked-core/geoladris/core/modules/message-bus"
	};

	// Global, to be accessed by plugins
	Squire = s;
	injector = null;
	bus = b;

	return {
		init : function(config) {
			var c = {
				context : "geoladris-test",
				baseUrl : "/base/src/main/resources/geoladris/" + PLUGIN_NAME + "/modules",
				paths : REQUIRE_JS_PATHS
			};

			c.config = config;
			require.config(c);

			if (injector != null) {
				injector.clean();
				injector.remove();
			}
			injector = new Squire(c.context);
			injector.mock("message-bus", bus);

			spyOn(bus, "send").and.callThrough();
			spyOn(bus, "listen").and.callThrough();
		}
	}
});
