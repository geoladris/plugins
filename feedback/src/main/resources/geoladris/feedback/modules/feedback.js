define([ "message-bus", "customization", "map", "toolbar", "i18n", "jquery", "jquery-ui", "openlayers", "./edit-controls", "ui/ui" ],//
function(bus, customization, map, toolbar, i18n, $) {

	var feedbackLayers = {};

	// Dialog controls
	var dlg;
	var dialogId = "feedback_popup";
	var cmbLayer;
	var lblTimestamp;
	var editToolbar;

	var feedbackLayer = new OpenLayers.Layer.Vector("Feedback");

	bus.send("ui-button:create", {
		div : "feedback-button",
		parentDiv : toolbar.attr("id"),
		css : "blue_button toolbar_button",
		text : "Feedback",
		sendEventName : "activate-feedback"
	});

	bus.send("ui-dialog:create", {
		div : dialogId,
		parentDiv : "map",
		title : i18n["feedback_title"],
		closeButton : true
	});
	dlg = $("#" + dialogId);

	bus.send("ui-choice-field:create", {
		div : "feedback-input-layer",
		parentDiv : dialogId,
		label : "Capa: " // i18n["Feedback.layer"]
	});
	cmbLayer = $("#feedback-input-layer").find("select");

	cmbLayer.change(refreshYear);
	lblTimestamp = $("<span/>").appendTo(dlg);
	$("<label/>").addClass("feedback-form-left").html("Drawing tools:").appendTo(dlg);
	$("<div/>").attr("id", "fb_toolbar").addClass("olControlPortalToolbar").appendTo(dlg);

	bus.send("ui-input-field:create", {
		div : "feedback-input-email",
		parentDiv : dialogId,
		label : "Email: " // i18n["Feedback.email"]
	});

	bus.send("ui-text-area-field:create", {
		div : "feedback-input-comment",
		parentDiv : dialogId,
		label : "Comentario: ", // i18n["Feedback.comment"]
		cols : 40,
		rows : 6
	});

	bus.send("ui-button:create", {
		div : "feedback-send",
		parentDiv : dialogId,
		css : "dialog-ok-button",
		text : "Send"
	});

	bus.send("ui-button:create", {
		div : "feedback-cancel",
		parentDiv : dialogId,
		css : "dialog-ok-button",
		text : "Cancel",
		sendEventName : "ui-hide",
		sendEventMessage : dialogId
	});

	bus.send("ui-form-collector:extend", {
		button : "feedback-send",
		sendEventName : "feedback-send",
		divs : [ "feedback-input-layer", "feedback-input-email", "feedback-input-comment" ],
		names : [ "layer", "email", "comment" ]
	});

	// Need to create after the dialog is in the DOM otherwise the call to
	// getElementById returns null
	editToolbar = new OpenLayers.Control.PortalToolbar(feedbackLayer, {
		div : document.getElementById("fb_toolbar")
	});

	bus.listen("feedback-send", function(e, msg) {
		var mailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (msg.layer == null) {
			bus.send("error", i18n["Feedback.no-layer-selected"]);
		} else if (!mailRegex.test(msg.email)) {
			bus.send("error", i18n["Feedback.invalid-email-address"]);
		} else if (!editToolbar.hasFeatures()) {
			bus.send("error", i18n["Feedback.no-geometries"]);
		} else {
			// Do submit
			var data = {
				"lang" : customization.languageCode,
				"comment" : msg.comment,
				"geometry" : editToolbar.getFeaturesAsWKT(),
				"layerName" : msg.layer,
				"email" : msg.email
			};

			var timestamp = feedbackLayers[msg.layer].timestamp;
			if (timestamp != null) {
				data.date = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear();
			}

			bus.send("ui-loading:start", i18n["Feedback.wait"]);

			bus.send("ajax", {
				type : 'POST',
				url : 'create-comment?',
				data : data,
				success : function(data, textStatus, jqXHR) {
					bus.send("info", i18n["Feedback.verify_mail_sent"]);
					bus.send("ui-hide", dialogId);
				},
				errorMsg : i18n["Feedback.submit_error"],
				complete : function() {
					bus.send("ui-loading:end", i18n["Feedback.wait"]);
				}
			});
		}
	});

	var activateFeedback = function() {
		if (cmbLayer.find("option").length == 0) {
			bus.send("error", i18n["Feedback.no_layer_visible"]);
		} else {
			map.addLayer(feedbackLayer);
			bus.send("ui-button:feedback-button:activate", true);
			bus.send("ui-text-area-field:feedback-input-comment:set-value", "");
			bus.send("ui-text-area-field:feedback-input-email:set-value", "");
			bus.send("activate-exclusive-control", editToolbar);
			bus.send("ui-show", "feedback_popup");
		}
	}

	bus.listen("ui-hide", function(e, id) {
		if (id != dialogId) {
			return;
		}
		feedbackLayer.removeAllFeatures();
		editToolbar.deactivate();
		map.removeLayer(feedbackLayer);
		bus.send("activate-default-exclusive-control");
		bus.send("ui-button:feedback-button:activate", false);
	});

	var refreshYear = function() {
		var text = "";
		var selectedLayer = feedbackLayers[cmbLayer.val()];
		if (selectedLayer != null) {
			timestamp = selectedLayer["timestamp"];
			if (timestamp != null) {
				text = timestamp.getUTCFullYear();
			}
		}
		lblTimestamp.html(text);
	}

	bus.listen("activate-feedback", activateFeedback);

	// Listen events
	bus.listen("layer-visibility", function(event, layerId, visibility) {
		if (layerId in feedbackLayers) {
			feedbackLayers[layerId].visibility = visibility;
			var currentValue = cmbLayer.val();
			var values = [];
			for (layerId in feedbackLayers) {
				var layerInfo = feedbackLayers[layerId];
				if (layerInfo["visibility"]) {
					values.push({
						text : layerInfo.name,
						value : layerId
					});
				}
			}

			bus.send("ui-choice-field:feedback-input-layer:set-values", [ values ]);
			if (currentValue != null && cmbLayer.find("option[value='" + currentValue + "']").length > 0) {
				cmbLayer.val(currentValue);
			} else {
				var firstOption = cmbLayer.find("option:first").val();
				cmbLayer.val(firstOption);
			}
		}
	});

	bus.listen("reset-layers", function() {
		feedbackLayers = {};
	});

	bus.listen("add-layer", function(event, portalLayer) {
		if (portalLayer.feedback) {
			feedbackLayers[portalLayer.id] = {
				name : portalLayer.label,
				visibility : false
			};
		}
	});

	bus.listen("layer-timestamp-selected", function(event, layerId, timestamp) {
		if (layerId in feedbackLayers) {
			feedbackLayers[layerId].timestamp = timestamp;
			refreshYear();
		}
	});
});