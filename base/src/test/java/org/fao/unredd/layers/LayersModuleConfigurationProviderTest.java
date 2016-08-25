package org.fao.unredd.layers;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.FileUtils;
import org.fao.unredd.jwebclientAnalyzer.PluginDescriptor;
import org.fao.unredd.portal.PortalRequestConfiguration;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import net.sf.json.JSONObject;

public class LayersModuleConfigurationProviderTest {
	private LayersModuleConfigurationProvider provider;
	private File confDir;
	private PortalRequestConfiguration portalConf;
	private HttpServletRequest request;

	@Before
	public void setup() throws IOException {
		this.provider = new LayersModuleConfigurationProvider();
		this.confDir = File.createTempFile("geoladris_base", "");
		this.confDir.delete();
		this.confDir.mkdir();

		this.portalConf = mock(PortalRequestConfiguration.class);
		when(portalConf.getConfigurationDirectory()).thenReturn(confDir);
		this.request = mock(HttpServletRequest.class);
	}

	@After
	public void teardown() throws IOException {
		FileUtils.deleteDirectory(this.confDir);
	}

	@Test
	public void testGetPluginConf() throws Exception {
		when(portalConf.localize(anyString())).thenReturn("{}");
		new File(this.confDir, "layers.json").createNewFile();

		Map<PluginDescriptor, JSONObject> config = provider
				.getPluginConfig(portalConf, request);

		assertEquals(1, config.size());
		JSONObject pluginConf = config.values().iterator().next();
		assertEquals(JSONObject.fromObject("{layers:{}}"), pluginConf);
	}
}
