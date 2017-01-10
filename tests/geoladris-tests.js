define("geoladris-tests", [ "Squire", "message-bus" ], function(Squire, bus) {
	// project basedir relative to the directory where karma.conf.js is
	// contained; useful for RequireJS paths below
  var root = "../../../../../../";
  var injector;
  
  return {
    init : function (name, config, paths) {
      if (!paths) {
        paths = {};
      }
      paths["jquery"] = root + "target/unpacked-core/geoladris/core/jslib/jquery-2.1.0";
      paths["message-bus"] = root + "target/unpacked-core/geoladris/core/modules/message-bus";

      var c = {
        context : "geoladris-test",
        baseUrl : "/base/src/main/resources/geoladris/" + name + "/modules",
        paths : paths
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

      return {
        bus : bus,
        injector : injector
      }
    }
	}
});

