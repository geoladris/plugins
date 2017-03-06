package org.fao.unredd.feedback.servlet;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Timer;
import java.util.TimerTask;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.fao.unredd.feedback.DBFeedbackPersistence;
import org.fao.unredd.feedback.Feedback;
import org.fao.unredd.feedback.Mailer;
import org.fao.unredd.feedback.MissingArgumentException;
import org.geoladris.Geoladris;
import org.geoladris.PersistenceException;
import org.geoladris.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FeedbackFilter implements Filter {

  private static final Logger logger = LoggerFactory.getLogger(FeedbackFilter.class);
  private Timer timer;

  private Map<String, Timer> timers = new HashMap<>();
  private Map<String, Feedback> feedbacks = new HashMap<>();

  @Override
  public void init(FilterConfig arg0) throws ServletException {}

  @Override
  public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
      throws IOException, ServletException {
    Config config = (Config) req.getAttribute(Geoladris.ATTR_CONFIG);
    Properties properties = config.getProperties();
    String schema = properties.getProperty("db-schema");
    Feedback feedback = null;
    try {
      feedback = this.feedbacks.get(schema);
      if (feedback == null) {
        feedback = new Feedback(new DBFeedbackPersistence(schema), new Mailer(properties));
        this.feedbacks.put(schema, feedback);
      }
      req.setAttribute("feedback", feedback);
    } catch (MissingArgumentException e) {
      logger.error("All mail parameters must be configured. " + e.getArgumentName() + " missing");
    }

    if (!this.timers.containsKey(schema)) {
      timer = new Timer();
      int rate;
      try {
        rate = Integer.parseInt(properties.getProperty("feedback-validation-check-delay"));
      } catch (NumberFormatException e) {
        logger.warn("feedback-validation-check property not present. Will check each 10 minutes");
        int tenMinutes = 1000 * 60 * 10;
        rate = tenMinutes;
      }
      timer.scheduleAtFixedRate(new FeedbackTask(feedback, config), 0, rate);
      this.timers.put(schema, timer);
    }
    
    chain.doFilter(req, resp);
  }

  @Override
  public void destroy() {
    for (Timer timer : this.timers.values()) {
      timer.cancel();
    }
  }

  private class FeedbackTask extends TimerTask {
    private Feedback feedback;
    private Config config;

    public FeedbackTask(Feedback feedback, Config config) {
      this.feedback = feedback;
      this.config = config;
    }

    @Override
    public void run() {
      try {
        if (feedback != null) {
          feedback.notifyValidated(config);
        } else {
          logger.error("No feedback instance skipping author notification");
        }
      } catch (PersistenceException e) {
        logger.error("Database error notifying the comment authors", e);
      }
    }
  }
}
