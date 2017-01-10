define("geoladris-tests", [ "Squire", "message-bus" ], function(Squire, bus) {
  var CONTEXT = "geoladris-test";

  // project basedir relative to the directory where karma.conf.js is
  // contained; useful for RequireJS paths below
  var root = "../../../../../../";
  var injector;

  function init(pluginName, config, paths) {
    paths = paths || {};
    paths["jquery"] = root + "target/unpacked-core/geoladris/core/jslib/jquery-2.1.0";
    paths["message-bus"] = root + "target/unpacked-core/geoladris/core/modules/message-bus";

    var c = {
      context : CONTEXT,
      baseUrl : "/base/src/main/resources/geoladris/" + pluginName + "/modules",
      paths : paths
    };

    c.config = config || {};
    require.config(c);

    if (injector != null) {
      injector.clean();
      injector.remove();
    }

    injector = new Squire(CONTEXT);
    injector.mock("message-bus", bus);

    bus.stopListenAll();
    spyOn(bus, "send").and.callThrough();
    spyOn(bus, "listen").and.callThrough();

    return {
      bus : bus,
      injector : injector
    }
  }

  function replaceParent(id) {
    var previous = document.getElementById(id);
    if (previous) {
      document.body.removeChild(previous);
    }

    var parent = document.createElement('div');
    parent.setAttribute("id", id);
    document.body.appendChild(parent);
  }

  return {
    init : init,
    replaceParent : replaceParent
  }
});

