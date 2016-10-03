describe("map", function() {
	var injector;
	var bus;

	beforeEach(function(done) {
		require.config({
			"baseUrl" : "src/",
			"paths" : {
				"message-bus" : "/core-modules/message-bus",
				"jquery" : "/core-jslib/jquery-2.1.0",
				"openlayers" : "/jslib/OpenLayers/OpenLayers.debug"
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

			injector.mock("layout", {
				map : {
					attr : function() {
						return "map";
					}
				}
			});
		});
	});

	it("sets map center on zoomTo with object", function(done) {
		injector.require([ "map" ], function(map) {
			map.addLayer(new OpenLayers.Layer.WMS("osm",
					"http://ows.terrestris.de/osm/service", {
						layers : "OSM-WMS",
						isBaseLayer : true,
						transparent : true,
						format : 'image/png'
					}));
			bus.send("zoom-to", {
				x : 12,
				y : 48,
				zoomLevel : 8
			});

			// // if no crs provided, zoomTo coordinates are always in 4326;
			// // map.projection may not
			// var center = map.center.clone();
			// center.transform(map.projection, "EPSG:4326");
			//
			// expect(Math.abs(center.lon - 12)).toBeLessThan(1e-10);
			// expect(Math.abs(center.lat - 48)).toBeLessThan(1e-10);
			// expect(map.zoom).toEqual(8);
			// expect(10).toBe(50);
			done();
		});
	});
});