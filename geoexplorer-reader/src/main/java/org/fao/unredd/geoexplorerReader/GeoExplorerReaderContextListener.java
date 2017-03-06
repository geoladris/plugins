package org.fao.unredd.geoexplorerReader;

import java.util.List;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.Geoladris;
import org.geoladris.config.ModuleConfigurationProvider;

public class GeoExplorerReaderContextListener implements ServletContextListener {

  @SuppressWarnings("unchecked")
  @Override
  public void contextInitialized(ServletContextEvent sce) {
    List<ModuleConfigurationProvider> providers = (List<ModuleConfigurationProvider>) sce
        .getServletContext().getAttribute(Geoladris.ATTR_CONFIG_PROVIDERS);
    providers.add(new GeoExplorerDBConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {}

}
