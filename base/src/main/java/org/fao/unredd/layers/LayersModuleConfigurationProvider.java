package org.fao.unredd.layers;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.IOUtils;
import org.geoladris.PortalRequestConfiguration;
import org.geoladris.config.ModuleConfigurationProvider;
import org.geoladris.config.PluginDescriptors;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class LayersModuleConfigurationProvider implements ModuleConfigurationProvider {

  @Override
  public Map<String, JSONObject> getPluginConfig(PortalRequestConfiguration configurationContext,
      HttpServletRequest request) throws IOException {
    // We create return a pseudo-plugin descriptor containing all the
    // configuration to override/merge
    // The modules, stylesheets and RequireJS data is empty since it is
    // taken from all the other real plugins.
    JSONObject conf = new JSONObject();

    String id = request.getParameter("mapId");
    if (id == null) {
      id = "";
    }
    String layersTemplate = IOUtils.toString(
        new File(configurationContext.getConfigurationDirectory(), "layers" + id + ".json").toURI(),
        "UTF-8");
    JSONObject content =
        (JSONObject) JSONSerializer.toJSON(configurationContext.localize(layersTemplate));
    conf.put("layers", content);
    return Collections.singletonMap(PluginDescriptors.UNNAMED_GEOLADRIS_CORE_PLUGIN, conf);
  }

  @Override
  public boolean canBeCached() {
    return true;
  }
}
