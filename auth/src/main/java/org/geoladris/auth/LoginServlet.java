package org.geoladris.auth;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.geoladris.config.Config;
import org.geoladris.servlet.AppContextListener;

public class LoginServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;

  public static final String PROP_AUTHORIZED_ROLES = "auth.roles";

  public static final String HTTP_PARAM_USER = "user";
  public static final String HTTP_PARAM_PASS = "password";

  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    String user = request.getParameter(HTTP_PARAM_USER);
    String pass = request.getParameter(HTTP_PARAM_PASS);

    if (user != null && user.length() > 0 && pass != null && pass.length() > 0) {
      request.getSession();
      request.login(user, pass);
    }

    if (isAuthorized(request)) {
      response.sendError(HttpServletResponse.SC_NO_CONTENT);
    } else {
      request.getSession().invalidate();
      request.logout();
      response.sendError(HttpServletResponse.SC_BAD_REQUEST);
    }
  }

  private boolean isAuthorized(HttpServletRequest request) {
    Config config = (Config) getServletContext().getAttribute(AppContextListener.ATTR_CONFIG);
    String rolesProp = config.getProperties().getProperty(PROP_AUTHORIZED_ROLES);
    String[] roles = rolesProp != null ? rolesProp.split("\\s*,\\s*") : new String[0];

    for (String role : roles) {
      if (request.isUserInRole(role)) {
        return true;
      }
    }

    return false;
  }
}
