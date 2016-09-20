package org.fao.unredd;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.fao.unredd.layers.LayersModuleConfigurationProvider;
import org.geoladris.config.Config;

public class LayersContextListener implements ServletContextListener {
	@Override
	public void contextInitialized(ServletContextEvent sce) {
		ServletContext servletContext = sce.getServletContext();
		final Config config = (Config) servletContext.getAttribute("config");
		config.addModuleConfigurationProvider(
				new LayersModuleConfigurationProvider());
	}

	@Override
	public void contextDestroyed(ServletContextEvent sce) {
	}
}
