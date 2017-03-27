package org.fao.unredd.geoexplorerReader;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;

public class GeoExplorerReaderContextListener implements ServletContextListener {
  @Override
  public void contextInitialized(ServletContextEvent sce) {
    Config config = (Config) sce.getServletContext().getAttribute(Geoladris.ATTR_CONFIG);
    config.addModuleConfigurationProvider(new GeoExplorerDBConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {}

}
