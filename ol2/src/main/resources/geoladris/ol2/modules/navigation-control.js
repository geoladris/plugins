define(["./controlMap"], function(controlMap){
	controlMap.registerControl("navigation", function(message){
		return new OpenLayers.Control.Navigation();
	});
})