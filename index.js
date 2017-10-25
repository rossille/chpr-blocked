'use strict';

const metrics = require('chpr-metrics');
const logger = require('chpr-logger');

/**
 * The blocked monitor class implement a feature that detects if the
 * event loop is blocked for more than a certain time, and logs an
 * error when this happens.
 */
class BlockedMonitor {
  /**
   * Creates an instance of BlockedMonitor
   *
   */
  constructor() {
    this._intervalId = null;
    this.running = false;
  }

  /**
   * Starts the monitoring. The "warmup time" counts from here.
   *
   * @param {String} serviceName The service name being monitored.
   * @returns {void}
   */
  start(serviceName) {
    this.delay = getIntFromEnv(process.env, 'BLOCKED_DELAY', 2000);
    const deprecatedTypoThreshold = getIntFromEnv(process.env, 'BLOCKED_THERSHOLD', 100);
    // for retro-compatibility:
    this.threshold = getIntFromEnv(process.env, 'BLOCKED_THRESHOLD', deprecatedTypoThreshold);
    this.loggerLevel = process.env.BLOCKED_LOGGER_LEVEL || 'error';
    if (typeof logger[this.loggerLevel] !== 'function') {
      throw new Error('Invalid logger level definition');
    }
    this.logFunction = logger[this.loggerLevel].bind(logger);

    if (this.running) {
      throw new Error('Invalid state: already running');
    }

    this.running = true;

    const checkInterval = Math.min(100, this.threshold / 2);

    setTimeout(() => {
      let startTime = process.hrtime();

      this._intervalId = setInterval(() => {
        if (!this.running) {
          return;
        }

        const delta = process.hrtime(startTime);
        const nanosec = (delta[0] * 1e9) + delta[1];
        const ms = nanosec / 1e6;
        const blockedTime = ms - checkInterval;

        if (blockedTime > this.threshold) {
          metrics.increment(`blocked`);
          metrics.timing(`blocked.duration`, blockedTime);
          this.logFunction({ blockedTime, serviceName },
            '[chpr-blocked] Process blocked for an excessive amount of time');
        }
        startTime = process.hrtime();
      }, checkInterval);
    }, this.delay);
  }

  /**
   * Stops the monitoring. No more errors will be reported unless it's started again.
   *
   * @returns {void}
   */
  stop() {
    if (!this.running) {
      throw new Error('Invalid state: not running');
    }

    this.running = false;
    clearInterval(this._intervalId);
  }
}

/**
 * Utility function to retrieve a configuration parameter from the
 * environment.
 *
 * @param {Object} env Any object containing "the environment", but most likely process.env
 * @param {String} name The name of the parameter to retrieve.
 * @param {Number} defaultValue The default value to use if there is a problem
 * @returns {Number} The parsed value, or the default value if no default is specified
 * or if there is a parsing error. An error is logged if there is a parsing error.
 */
function getIntFromEnv(env, name, defaultValue) {
  if (!(name in env)) {
    return defaultValue;
  }

  const value = parseInt(env[name], 10);
  if (Number.isNaN(value)) {
    logger.error({ name, value: env[name] },
      '[chpr-blocked] Cannot parse configuration parameter, using default value.');
    return defaultValue;
  }

  return value;
}

const singleton = new BlockedMonitor();

module.exports = {
  BlockedMonitor,
  stop() {
    singleton.stop();
  },
  start(serviceName) {
    singleton.start(serviceName);
  },
  isRunning() {
    return singleton.running;
  },
  // exported for tests
  getIntFromEnv,
  singleton
};
