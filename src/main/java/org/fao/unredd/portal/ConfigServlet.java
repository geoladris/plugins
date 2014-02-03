package org.fao.unredd.portal;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Locale;
import java.util.ResourceBundle;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class ConfigServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		Config config = (Config) getServletContext().getAttribute("config");
		Locale locale = (Locale) req.getAttribute("locale");

		ResourceBundle bundle = config.getMessages(locale);

		String title = bundle.getString("title");

		JSONObject moduleConfig = new JSONObject();
		moduleConfig.element("customization",
				buildCustomizationObject(config, locale, title));
		moduleConfig.element("i18n", buildI18NObject(bundle));
		moduleConfig.element("layers",
				JSONSerializer.toJSON(config.getLayers(locale)));

		String json = new JSONObject().element("config", moduleConfig)
				.toString();

		resp.setContentType("application/javascript");
		resp.setCharacterEncoding("utf8");
		PrintWriter writer = resp.getWriter();
		writer.write("var require = " + json);
	}

	private HashMap<String, String> buildI18NObject(ResourceBundle bundle) {
		HashMap<String, String> messages = new HashMap<String, String>();
		for (String key : bundle.keySet()) {
			messages.put(key, bundle.getString(key));
		}

		return messages;
	}

	private JSONObject buildCustomizationObject(Config config, Locale locale,
			String title) {
		return new JSONObject().element("title", title)//
				.element("languages", config.getLanguages())//
				.element("languageCode", locale.getLanguage())//
				.element("queryURL", config.getQueryURL())//
				.element("layerURL", config.getLayerURL())//
				.element("modules", config.getModules());
	}

}
