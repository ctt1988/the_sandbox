var config = require('config');

/**
 * New Relic agent configuration.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: [config.get('newrelic.app_name')],
  /**
   * Your New Relic license key.
   */
  license_key: config.get('newrelic.license_key'),
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: config.get('newrelic.level')
  }
};
