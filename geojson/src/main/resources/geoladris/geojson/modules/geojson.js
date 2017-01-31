define([ "wellknown" ], function(wellknown) {

	function toCoordinateList(ordinateList) {
		var coordinates = [];
		for (var i = 0; i < ordinateList.length; i += 2) {
			coordinates.push([ ordinateList[i], ordinateList[i + 1] ]);
		}
		return coordinates;
	}
	
	return {
		"createFeature" : function(geometry, properties) {
			return {
				"type" : "Feature",
				"geometry" : geometry,
				"properties" : properties
			}
		},
		"createPoint" : function(x, y) {
			return {
				"type" : "Point",
				"coordinates" : [ x, y ]
			}
		},
		"createLineString" : function() {
			return {
				"type" : "LineString",
				"coordinates" : toCoordinateList(arguments)
			}
		},
		"createPolygon" : function(externalRing, internalRings) {
			if (!internalRings) {
				internalRings = [];
			}
			var allRings = [ externalRing ].concat(internalRings);
			for (var i = 0; i < allRings.length; i++) {
				allRings[i] = toCoordinateList(allRings[i]);
			}
			return {
				"type" : "Polygon",
				"coordinates" : allRings
			}
		},
		"createMultiPolygon" : function(polygons) {
			polygonCoordinates = polygons.map(function(polygon) {
				return polygon.coordinates;
			});
			return {
				"type" : "MultiPolygon",
				"coordinates" : polygonCoordinates
			}
		},
		"toWKT" : function(geojson) {
			return wellknown.stringify(geojson);
		},
		"fromWKT" : function(wkt) {
			return wellknown.parse(wkt);
		}
	};
});