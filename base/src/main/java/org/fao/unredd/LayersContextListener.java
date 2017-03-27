package org.fao.unredd;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.fao.unredd.layers.LayersModuleConfigurationProvider;
import org.geoladris.Geoladris;
import org.geoladris.config.Config;

public class LayersContextListener implements ServletContextListener {
  @Override
  public void contextInitialized(ServletContextEvent sce) {
    Config config = (Config) sce.getServletContext().getAttribute(Geoladris.ATTR_CONFIG);
    config.addModuleConfigurationProvider(new LayersModuleConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {}
}
