define([ "jquery", "message-bus", "i18n", "auth-user", "module", "jquery-ui" ], function($, bus, i18n, authUser, module) {
	var LOGOUT = "logout";
	var LOGIN = "login";
	var DIALOG_ID = "auth-dialog";

	var config = module.config();
	var buttonConf = config.button;

	var dialog;
	var formDiv;
	var userInput;
	var passInput;

	function loginSuccess(data, textStatus, jqXHR) {
		console.log(data);
		console.log(textStatus);
		console.log(jqXHR);
		// Disable inputs so their values are not appended to the URL
		userInput.attr("disabled", "disabled");
		passInput.attr("disabled", "disabled");

		// Set redirection to the form and submit
		var url = window.location.href;
		url = url.substring(0, url.lastIndexOf("/") + 1);
		formDiv.attr("action", url);
		formDiv.submit();
	}

	function doLogin(user, password) {
		if (!user || !password) {
			bus.send("error", i18n["auth.login_error"]);
		}

		bus.send("ui-loading:start", i18n["auth.wait"]);
		bus.send("ajax", {
			type : 'POST',
			url : LOGIN,
			data : {
				user : user,
				password : password
			},
			success : loginSuccess,
			errorMsg : i18n["auth.login_error"],
			complete : function() {
				bus.send("ui-loading:end", i18n["auth.wait"]);
			}
		});
	}

	function initLogged() {
		// Create button
		var button = $("<div/>").attr("id", buttonConf.div);
		button.addClass("auth-login-logout-button");
		button.text(i18n["auth.logout"]);
		button.appendTo($("#" + buttonConf.parentDiv));
		button.click(function() {
			bus.send("ajax", {
				type : 'GET',
				url : LOGOUT,
				success : function() {
				},
				errorMsg : i18n["auth.login_error"],
				complete : function() {
					window.location.reload();
				}
			});
		});

		bus.send("login", authUser);
	}

	function initNotLogged() {
		// Create button
		var button = $("<div/>").attr("id", buttonConf.div);
		button.addClass("auth-login-logout-button");
		button.text(i18n["auth.login"]);
		button.appendTo($("#" + buttonConf.parentDiv));

		// Create dialog
		dialog = $("<div/>").attr("id", DIALOG_ID);
		dialog.addClass("auth-dialog");
		dialog.appendTo("body");

		formDiv = $("<form/>").attr("id", DIALOG_ID + "-form");
		dialog.append(formDiv);

		var userContainer = $("<div/>").appendTo(formDiv).addClass("auth-input-container");
		var userLabel = $("<div>" + i18n["auth.user"] + "<div>");
		userLabel.attr("id", DIALOG_ID + "-user-label");
		userLabel.addClass("auth-label");
		userContainer.append(userLabel);

		userInput = $("<input/>").attr("id", DIALOG_ID + "-user-input");
		userInput.addClass("auth-input");
		userInput.attr("type", "text");
		userContainer.append(userInput);

		var passContainer = $("<div/>").appendTo(formDiv).addClass("auth-input-container");
		var passLabel = $("<div>" + i18n["auth.pass"] + "<div>");
		passLabel.attr("id", DIALOG_ID + "-pass-label");
		passLabel.addClass("auth-label");
		passContainer.append(passLabel);

		passInput = $("<input/>").attr("id", DIALOG_ID + "-pass-input");
		passInput.addClass("auth-input");
		passInput.attr("type", "password");
		passContainer.append(passInput);

		var send = $("<div/>").attr("id", DIALOG_ID + "-submit-button");
		send.addClass("auth-submit blue_button");
		send.attr("type", "submit");
		send.text(i18n["auth.submit"]);
		formDiv.append(send);

		send.click(function() {
			doLogin(userInput.val(), passInput.val());
		});

		dialog.dialog({
			autoOpen : false,
			closeOnEscape : false,
			width : "auto",
			zIndex : 2000,
			resizable : false,
			position : {
				my : "left top",
				at : "left-300 bottom+40",
				of : button
			},
			title : i18n["auth.title"]
		});

		// Link button and dialog
		button.click(function() {
			dialog.dialog("open");
		});
	}

	if (authUser) {
		initLogged();
	} else {
		initNotLogged();
	}
});