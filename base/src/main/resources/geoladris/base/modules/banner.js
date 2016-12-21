define([ "jquery", "layout", "i18n", "message-bus", "module", "ui/ui" ], function($, layout, i18n, bus, module) {

	var config = module.config();

	if (!config["hide"]) {
		bus.send("ui-html:create", {
			div : "banner",
			parentDiv : layout.header.attr("id"),
			priority : 1
		});

		if (config["show-flag"]) {
			bus.send("ui-html:create", {
				div : "flag",
				parentDiv : "banner"
			});
		}

		if (config["show-logos"]) {
			bus.send("ui-html:create", {
				div : "logos",
				parentDiv : "banner"
			});
		}

		bus.send("ui-html:create", {
			div : "title",
			parentDiv : "banner",
			html : i18n["title"]
		});
		bus.send("ui-html:create", {
			div : "banner-izq",
			parentDiv : "banner",
			html : i18n["title"]
		});
	}
});
