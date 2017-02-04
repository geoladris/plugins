define([ "geoladris-tests" ], function(tests) {

	describe("portalMapConnector", function() {
		var bus;
		var injector;

		beforeEach(function() {
			var initialization = tests.init("base", {}, {});
			injector = initialization.injector;
			bus = initialization.bus;
		});

		it("add-layer + layers-loaded triggers map:addLayer", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer",
					"mapLayers" : [ {
						"id" : "mymaplayer",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"queryUrl" : "http://query.url"
					} ]
				});
				bus.send("layers-loaded");
				expect(bus.send).toHaveBeenCalledWith("map:addLayer", {
					"layerId" : "mymaplayer",
					"enabled" : false,
					"wms" : {
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer"
					}
				});
				done();
			}
			injector.require([ "portalMapConnector" ], fcn);

		});

		it("add-layer z-order sets map:addLayer order", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "layer1",
					"mapLayers" : [ {
						"id" : "maplayer1",
						"type" : "osm",
						"osmUrls" : [ "http://base.url" ],
						"zIndex" : 2
					} ]
				});
				bus.send("add-layer", {
					"id" : "layer2",
					"mapLayers" : [ {
						"id" : "maplayer2",
						"type" : "wfs",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"zIndex" : 1
					} ]
				});
				var calls = bus.send.calls;
				calls.reset();
				bus.send("layers-loaded");
				expect(calls.count()).toBe(3);
				expect(calls.argsFor(1)[0]).toEqual("map:addLayer");
				expect(calls.argsFor(1)[1].layerId).toEqual("maplayer2");
				expect(calls.argsFor(2)[0]).toEqual("map:addLayer");
				expect(calls.argsFor(2)[1].layerId).toEqual("maplayer1");
				done();
			}
			injector.require([ "portalMapConnector" ], fcn);

		});

		it("add-layer creates control if queryType present", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer",
					"mapLayers" : [ {
						"id" : "mymaplayer",
						"queryType" : "wms",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"queryUrl" : "http://query.url"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer"
				});
				expect(bus.send).toHaveBeenCalledWith("map:createControl", jasmine.objectContaining({
					"controlId" : "mymaplayer",
					"controlType" : "wmsinfo",
					"queryUrl" : "http://query.url",
					"layerUrl" : "http://base.url"
				}));
				done();
			}
			injector.require([ "portalMapConnector" ], fcn);

		});

		it("add-layer does not create control if queryType not present", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer",
					"mapLayers" : [ {
						"id" : "mymaplayer",
						"baseUrl" : "http://base.url",
						"queryUrl" : "http://query.url"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer"
				});
				expect(bus.send).not.toHaveBeenCalledWith("map:createControl", jasmine.any(Object));
				done();
			}
			injector.require([ "portalMapConnector" ], fcn);

		});

		it("layer-visibility activates/deactivates control", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer1",
					"active" : true,
					"mapLayers" : [ {
						"id" : "mymaplayer1",
						"queryType" : "wms",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"queryUrl" : "http://query.url"
					}, {
						"id" : "mymaplayer2",
						"queryType" : "wms",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"queryUrl" : "http://query.url"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer1"
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer2"
				});

				expect(bus.send).not.toHaveBeenCalledWith("map:activateControl", jasmine.any(Object));
				expect(bus.send).not.toHaveBeenCalledWith("map:activateControl", jasmine.any(Object));
				expect(bus.send).not.toHaveBeenCalledWith("map:deactivateControl", jasmine.any(Object));
				expect(bus.send).not.toHaveBeenCalledWith("map:deactivateControl", jasmine.any(Object));
				bus.send("layer-visibility", [ "mylayer1", true ]);
				expect(bus.send).toHaveBeenCalledWith("map:activateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer1"
				}));
				expect(bus.send).toHaveBeenCalledWith("map:activateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer2"
				}));
				expect(bus.send).not.toHaveBeenCalledWith("map:deactivateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer1"
				}));
				expect(bus.send).not.toHaveBeenCalledWith("map:deactivateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer2"
				}));
				bus.send("layer-visibility", [ "mylayer1", false ]);
				expect(bus.send).toHaveBeenCalledWith("map:deactivateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer1"
				}));
				expect(bus.send).toHaveBeenCalledWith("map:deactivateControl", jasmine.objectContaining({
					"controlId" : "mymaplayer2"
				}));

				done();
			}
			injector.require([ "portalMapConnector" ], fcn);
		});

		it("layer-visibility activates/deactivates only queriable layers", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer1",
					"active" : true,
					"mapLayers" : [ {
						"id" : "mymaplayer1",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer1"
				});

				expect(bus.send).not.toHaveBeenCalledWith("map:activateControl", jasmine.any(Object));
				bus.send("layer-visibility", [ "mylayer1", true ]);
				expect(bus.send).not.toHaveBeenCalledWith("map:activateControl", jasmine.any(Object));

				done();
			}
			injector.require([ "portalMapConnector" ], fcn);
		});

		it("Reset layers destroys all info-control instances", function(done) {
			var fcn = function(portalMapConnector) {
				bus.send("add-layer", {
					"id" : "mylayer1",
					"active" : true,
					"mapLayers" : [ {
						"id" : "mymaplayer1",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer1"
				});
				bus.send("add-layer", {
					"id" : "layer2",
					"mapLayers" : [ {
						"id" : "mymaplayer2",
						"baseUrl" : "http://base.url",
						"wmsName" : "ws:layer",
						"queryType" : "wms"
					} ]
				});
				bus.send("map:layerAdded", {
					"layerId" : "mymaplayer2"
				});

				bus.send("reset-layers");
				expect(bus.send).not.toHaveBeenCalledWith("map:destroyControl", jasmine.objectContaining({
					"controlId" : "mymaplayer1"
				}));
				expect(bus.send).toHaveBeenCalledWith("map:destroyControl", jasmine.objectContaining({
					"controlId" : "mymaplayer2"
				}));

				done();
			}
			injector.require([ "portalMapConnector" ], fcn);
		});

});
