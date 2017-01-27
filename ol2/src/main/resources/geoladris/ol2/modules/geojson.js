define(function() {
	return {
		"createFeature" : function(geometry, properties) {
			return {
				"type" : "Feature",
				"geometry" : geometry,
				"properties": properties
			}
		},
		"createPoint" : function(x, y) {
			return {
				"type" : "Point",
				"coordinates" : [ x, y ]
			}
		}
	};
});