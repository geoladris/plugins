package org.geoladris.auth;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.config.Config;
import org.geoladris.servlet.AppContextListener;

public class AuthContextListener implements ServletContextListener {

  @Override
  public void contextInitialized(ServletContextEvent event) {
    Config config = (Config) event.getServletContext().getAttribute(AppContextListener.ATTR_CONFIG);
    config.addModuleConfigurationProvider(new AuthConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent event) {
    // do nothing
  }
}
