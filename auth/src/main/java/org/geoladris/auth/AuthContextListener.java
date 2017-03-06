package org.geoladris.auth;

import java.util.List;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.Geoladris;
import org.geoladris.config.ModuleConfigurationProvider;

public class AuthContextListener implements ServletContextListener {

  @SuppressWarnings("unchecked")
  @Override
  public void contextInitialized(ServletContextEvent event) {
    List<ModuleConfigurationProvider> providers = (List<ModuleConfigurationProvider>) event
        .getServletContext().getAttribute(Geoladris.ATTR_CONFIG_PROVIDERS);
    providers.add(new AuthConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent event) {
    // do nothing
  }
}
