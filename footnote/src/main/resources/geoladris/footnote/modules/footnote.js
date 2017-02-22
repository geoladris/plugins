define([ "message-bus", "module", "i18n", "jquery", "ui/ui" ], function(bus, module, i18n, $, ui) {
  var config = module.config();
  
  var links = [];
  if (config.hasOwnProperty("notes")) {
	  for (var i = 0; i < config.notes.length; i++) {
		note = config.notes[i];
		links.push({
			text : i18n[note.text] || note.text,
			link : i18n[note.link] || note.link
		});
	  }
  } else {
	  links.push({
		  text : i18n[config.text] || config.text,
		  link : i18n[config.link] || config.link
	  });
  }
  
  // Optional. "left", "center" or "right". Defaults to "center".
  var align = config.align || "center";

  var container;
  
  bus.listen("modules-initialized", function(e, message) {
	  var parent = null;
	  if (config.hasOwnProperty("htmlId")) {
		  parent = config.htmlId;
		  if (parent == null) { 
			  parent = document.body;
		  }
	  } else {
		  // backwards compatibility
		  parent = "map"
	  }
	  container = ui.create("div", {
		  id : "footnote-container",
		  parent : parent,
		  css : "footnote"
	  });
	  for (var i = 0; i < links.length; i++) {
		  var btn = ui.create("a", {
			  id : "footnote-link-" + i,
			  parent : "footnote-container",
			  html : links[i].text,
			  css : "footnote-link"
		  });
		  btn.href = links[i].link;
		  btn.target = "_blank";
		  btn.style["text-align"] = align;
		  if (i < links.length - 1) {
			  ui.create("span", {
				  parent : "footnote-container",
				  html : " - ",
				  css : "footnote-link"				  
			  });
		  }
	  }
  });
});
