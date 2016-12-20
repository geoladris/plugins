define([ "message-bus", "module", "layout", "i18n", "jquery", "ui/ui" ], function(bus, module, layout, i18n, $) {
  var config = module.config();
  var text = i18n[config.text] || config.text; // Required. Text can be a literal string or an i18n key reference.
  var link = i18n[config.link] || config.link; // Optional. Link can be a literal string or an i18n key reference.
  var align = config.align || "center"; // Optional. "left", "center" or "right". Defaults to "center".

  bus.send("ui-html:create", {
    div : "footnote-container",
    parentDiv : layout.map.attr("id"),
    css : "footnote"
  });

  var textDiv;
  if (link) {
    bus.send("ui-button:create", {
      div : "footnote-link",
      text : text,
      parentDiv : "footnote-container",
      css : "footnote-link",
      sendEventName : "ui-open-url",
      sendEventMessage : {
        url : link,
        target : "_blank"
      }
    });
    textDiv = "footnote-link";
  } else {
    bus.send("ui-set-content", {
      div : "footnote-container",
      html : text
    });
    textDiv = "footnote-container";
  }

  bus.send("ui-css", {
    div : textDiv,
    key : "text-align",
    value : align
  });
});
