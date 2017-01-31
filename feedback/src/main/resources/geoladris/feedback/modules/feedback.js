define([ "message-bus", "customization", "toolbar", "i18n", "jquery", "jquery-ui" ], function(bus, customization, toolbar, i18n, $) {

	var feedbackLayers = new Array();

	// Dialog controls
	var dlg;
	var cmbLayer;
	var lblTimestamp;
	var txtEmail;
	var txtComment;
	var feedbackLayerId = "feedbackLayer";
	var features = [];

	var btn = $("<a/>").attr("id", "feedback-button").addClass("blue_button toolbar_button").html("Feedback");

	var initializeDialog = function() {
		dlg = $("<div/>").attr("id", "feedback_popup");
		$("<label/>").addClass("feedback-form-left").html("Capa:").appendTo(dlg);
		cmbLayer = $("<select/>").attr("id", "feedback-layer-combo").appendTo(dlg);
		cmbLayer.change(refreshYear);
		lblTimestamp = $("<span/>").appendTo(dlg);

		dlg.append("<br/>");
		$("<label/>").addClass("feedback-form-left").html("Drawing tools:").appendTo(dlg);
		$("<span/>").attr("id", "feedbackAddFeature").html(
				i18n["feedback_addfeature_tooltip"]).addClass(
				"feedbackButton").appendTo(dlg).on("click", function(){
					bus.send("activate-exclusive-control", "DrawPolygon");
				});
		$("<span/>").attr("id", "feedbackEditFeature").html(
				i18n["feedback_editfeature_tooltip"]).addClass(
				"feedbackButton").appendTo(dlg).on("click", function(){
					bus.send("activate-exclusive-control", "ModifyFeature");
				});

		dlg.append("<br/>");
		$("<label/>").addClass("feedback-form-left").html("Email:").appendTo(dlg);
		txtEmail = $("<input/>").attr("type", "text").attr("size", "40").appendTo(dlg);

		dlg.append("<br/>");
		$("<label/>").addClass("feedback-form-left").html("Comentario:").appendTo(dlg);
		txtComment = $("<textarea/>").attr("cols", "40").attr("rows", "6").appendTo(dlg);

		dlg.append("<br/>");
		var btnClose = $("<div/>").html("Cerrar").appendTo($("<div/>").addClass("feedback-form-left").appendTo(dlg));
		btnClose.button().click(function() {
			dlg.dialog('close');
		});
		var btnSubmit = $("<div/>").html("Enviar").appendTo(dlg);
		btnSubmit.button().click(function() {
			submit();
		});

		dlg.dialog({
			autoOpen : false,
			closeOnEscape : false,
			width : "auto",
			zIndex : 2000,
			resizable : false,
			position : {
				my : "left top",
				at : "left bottom+40",
				of : btn
			},
			title : i18n["feedback_title"],
			close : deactivateFeedback
		});
	}

	var submit = function() {
		var mailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (cmbLayer.val() == null) {
			bus.send("error", i18n["Feedback.no-layer-selected"]);
		} else if (!mailRegex.test(txtEmail.val())) {
			bus.send("error", i18n["Feedback.invalid-email-address"]);
		} else if (features.length == 0) {
			bus.send("error", i18n["Feedback.no-geometries"]);
		} else {
			// Do submit
			var polygons = [];
			for (var i = 0; i < features.length; i++) {
				polygons.push(features[i].geometry);
			}
			var multipolygon = geojson.createMultipolygon(polygons);

			var data = {
				"lang" : customization.languageCode,
				"comment" : txtComment.val(),
				"geometry" : geojson.toWKT(multipolygon),
				"layerName" : cmbLayer.val(),
				"email" : txtEmail.val()
			};

			var timestamp = feedbackLayers[cmbLayer.val()].timestamp;
			if (timestamp != null) {
				data.date = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear();
			}

			bus.send("show-wait-mask", i18n["Feedback.wait"]);

			bus.send("ajax", {
				type : 'POST',
				url : 'create-comment?',
				data : data,
				success : function(data, textStatus, jqXHR) {
					bus.send("info", i18n["Feedback.verify_mail_sent"]);
					dlg.dialog('close');
				},
				errorMsg : i18n["Feedback.submit_error"],
				complete : function() {
					bus.send("hide-wait-mask");
				}
			});
		}
	}

	var activateFeedback = function() {
		if (!btn.hasClass("selected")) {
			if (cmbLayer.find("option").length == 0) {
				bus.send("error", i18n["Feedback.no_layer_visible"]);
			} else {
				$("#button_feedback").addClass('selected');
				txtEmail.val("");
				txtComment.val("");
				bus.send("activate-exclusive-control", "DrawPolygon");
				bus.send("map:addLayer", {
					"layerId" : feedbackLayerId,
					"vector" : {}
				});
				features = [];
				dlg.dialog("open");
			}
		}
	}

	var deactivateFeedback = function() {
		bus.send("activate-default-exclusive-control");
		bus.send("map:removeLayer", {
			"layerId" : feedbackLayerId
		});
		features = [];
		$("#button_feedback").removeClass('selected');
		dlg.dialog("close");
	}

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

	initializeDialog();

	// Install feedback button
	btn.appendTo(toolbar);
	btn.click(function() {
		activateFeedback();
		return false;
	});

	bus.listen("map:featureAdded", function(e, message) {
		if (message.layerId == "feedbackLayerId"){
			features.push(message.feature);
		}
	});
	
	bus.listen("activate-feedback", activateFeedback);
	bus.listen("deactivate-feedback", function() {
		// Enough, the close listener will clean up, as when manually closed
		dlg.dialog("close");
	});

	// Listen events
	bus.listen("layer-visibility", function(event, layerId, visibility) {
		if (layerId in feedbackLayers) {
			feedbackLayers[layerId].visibility = visibility;
			var currentValue = cmbLayer.val();
			cmbLayer.empty();
			for (layerId in feedbackLayers) {
				var layerInfo = feedbackLayers[layerId];
				if (layerInfo["visibility"]) {
					$("<option/>").attr("value", layerId).html(layerInfo.name).appendTo(cmbLayer);
				}
			}
			if (currentValue != null && cmbLayer.find("option[value='" + currentValue + "']").length > 0) {
				cmbLayer.val(currentValue);
			} else {
				var firstOption = cmbLayer.find("option:first").val();
				cmbLayer.val(firstOption);
			}
		}
	});

	bus.listen("reset-layers", function() {
		feedbackLayers = new Array();
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