define([ "message-bus", "module", "layout", "i18n", "jquery", "ui/ui" ], function(bus, module, layout, i18n, $, ui) {
  var config = module.config();
  // Required. Text can be a literal string or an i18n key reference.
  var text = i18n[config.text] || config.text;
  // Optional. Link can be a literal string or an i18n key reference.
  var link = i18n[config.link] || config.link;
  // Optional. "left", "center" or "right". Defaults to "center".
  var align = config.align || "center";

  var container = ui.create("div", {
    id : "footnote-container",
    parent : layout.map.attr("id"),
    css : "footnote"
  });

  var textDiv;
  if (link) {
    ui.create("button", {
      id : "footnote-link",
      parent : "footnote-container",
      text : text,
      css : "footnote-link",
      sendEventName : "ui-open-url",
      sendEventMessage : {
        url : link,
        target : "_blank"
      }
    });
    textDiv = "footnote-link";
  } else {
    container.innerHTML = text;
    textDiv = "footnote-container";
  }

  document.getElementById(textDiv).style["text-align"] = align;
});
