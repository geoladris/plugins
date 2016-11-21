define([ "message-bus", "toolbar", "jquery" ], function(bus, toolbar, $) {

	var layerRoot;
	bus.listen("layers-loaded", function(e, root) {
		layerRoot = root;
	});

	var btn = $("<a/>")//
	.attr("id", "save-layers-button")//
	.addClass("blue_button toolbar_button")//
	.html("Guardar capas")//
	.click(function() {
		bus.send("ajax", {
			type : 'PUT',
			url : 'layers.json',
			contentType : "application/json; charset=utf-8",
			data : JSON.stringify(layerRoot, null, 4),
			success : function(data, textStatus, jqXHR) {
				require([ "text!../layers.json?a=" + new Date().getTime() ], function(newLayerRoot) {
					bus.send("layers-set-root", JSON.parse(newLayerRoot));
				});
			},
			errorMsg : "Error uploading layers.json to the server" // TODO i18n
		});
	})//
	.appendTo(toolbar);

});