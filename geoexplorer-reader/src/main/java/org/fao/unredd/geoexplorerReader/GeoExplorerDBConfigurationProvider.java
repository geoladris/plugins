package org.fao.unredd.geoexplorerReader;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.fao.unredd.jwebclientAnalyzer.PluginDescriptor;
import org.fao.unredd.portal.ConfigurationException;
import org.fao.unredd.portal.DBUtils;
import org.fao.unredd.portal.ModuleConfigurationProvider;
import org.fao.unredd.portal.PersistenceException;
import org.fao.unredd.portal.PortalRequestConfiguration;

import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class GeoExplorerDBConfigurationProvider
		implements
			ModuleConfigurationProvider {

	public GeoExplorerDBConfigurationProvider() {
	}

	@Override
	public Map<PluginDescriptor, JSONObject> getPluginConfig(
			PortalRequestConfiguration configurationContext,
			HttpServletRequest request) throws IOException {
		JSONObject conf = new JSONObject();
		conf.put("geoexplorer-layers",
				getGeoExplorerLayers(configurationContext, request));
		return Collections.singletonMap(new PluginDescriptor(true), conf);
	}

	private JSON getGeoExplorerLayers(
			PortalRequestConfiguration configurationContext,
			HttpServletRequest request) {
		try {
			String mapIdParameter = request.getParameter("mapId");
			int mapId;
			if (mapIdParameter != null) {
				try {
					mapId = Integer.parseInt(mapIdParameter);
				} catch (NumberFormatException e) {
					throw new ConfigurationException(
							"mapId must be an integer");
				}
			} else {
				throw new ConfigurationException(
						"mapId parameter must be configured");
			}
			return getGeoExplorerLayers(mapId);
		} catch (PersistenceException e) {
			throw new ConfigurationException("Cannot read geoexplorer database",
					e);
		}
	}

	private JSON getGeoExplorerLayers(final int mapId)
			throws PersistenceException {
		String config = DBUtils.processConnection("geoexplorer",
				new DBUtils.ReturningDBProcessor<String>() {

					@Override
					public String process(Connection connection)
							throws SQLException {
						PreparedStatement statement = connection
								.prepareStatement(
										"select config from maps where id=?");
						statement.setInt(1, mapId);
						ResultSet rs = statement.executeQuery();
						if (rs.next()) {
							return rs.getString(1);
						} else {
							return null;
						}
					}
				});

		return JSONSerializer.toJSON(config);
	}

	@Override
	public boolean canBeCached() {
		return false;
	}

}
