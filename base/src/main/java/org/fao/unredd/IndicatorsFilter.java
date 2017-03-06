package org.fao.unredd;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.fao.unredd.layers.bd.DBLayerFactory;
import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class IndicatorsFilter implements Filter {

  private static final Logger logger = LoggerFactory.getLogger(IndicatorsFilter.class);

  private Map<String, DBLayerFactory> factories = new HashMap<>();

  @Override
  public void init(FilterConfig arg0) throws ServletException {}

  @Override
  public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
      throws IOException, ServletException {
    Config config = (Config) req.getAttribute(Geoladris.ATTR_CONFIG);
    Properties properties = config.getProperties();
    String schema = properties.getProperty("db-schema");
    try {
      DBLayerFactory layerFactory = this.factories.get(schema);
      if (layerFactory == null) {
        layerFactory = new DBLayerFactory(schema);
        this.factories.put(schema, layerFactory);
      }
      req.setAttribute("layer-factory", layerFactory);
    } catch (NullPointerException e) {
      logger.error(
          "The statistics metadata table name was not configured. Please set the \"indicators-metadata-db-table\" property",
          e);
    }
    
    chain.doFilter(req, resp);
  }

  @Override
  public void destroy() {}
}
