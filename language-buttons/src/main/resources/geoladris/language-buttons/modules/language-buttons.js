define([ "message-bus", "toolbar", "customization", "ui/ui" ], function(bus, toolbar, customization) {
	var langs = customization.languages;
	for (var i = 0; i < langs.length; i++) {
		bus.send("ui-button:create", {
			div : "lang-button-" + langs[i].code,
			parentDiv : toolbar.attr("id"),
			text : langs[i].name,
			css : "blue_button toolbar_button lang_button",
			sendEventName : "ui-open-url",
			sendEventMessage : {
				url : "?lang=" + langs[i].code,
				target : "_self"
			}
		});
		bus.send("ui-button:lang-button-" + langs[i].code + ":activate", customization.languageCode == langs[i].code);
	}
});
