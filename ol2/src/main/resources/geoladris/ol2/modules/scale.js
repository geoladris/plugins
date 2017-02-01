define(["./controlMap"], function(controlMap){
	controlMap.registerControl("scale", function(message){
		return new OpenLayers.Control.Scale();
	});
})