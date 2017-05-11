'use strict';

const logger = require('chpr-logger');

const CHECK_INTERVAL = 100;

/**
 * The blocked monitor class implement a feature that detects if the
 * event loop is blocked for more than a certain time, and logs an
 * error when this happens.
 */
class BlockedMonitor {
  /**
   * Creates an instance of BlockedMonitor
   *
   * @param {Number} delay A "warmup time" during which we tolerate blocking
   * the loop, in milliseconds.
   * @param {Number} threshold The maximum acceptable event loop blocking time,
   * in milliseconds.
   */
  constructor(delay, threshold) {
    this.delay = delay;
    this.threshold = threshold;
    this._intervalId = null;
    this.running = false;
  }

  /**
   * Starts the monitoring. The "warmup time" counts from here.
   *
   * @returns {BlockedMonitor} the instance, for chainability.
   */
  start() {
    if (this.running) {
      throw new Error('Invalid state: already running');
    }

    this.running = true;
    setTimeout(() => {
      let startTime = process.hrtime();

      this._intervalId = setInterval(() => {
        if (!this.running) {
          return;
        }

        const delta = process.hrtime(startTime);
        const nanosec = (delta[0] * 1e9) + delta[1];
        const ms = nanosec / 1e6;
        const blockedTime = ms - CHECK_INTERVAL;

        if (blockedTime > this.threshold) {
          logger.error({ blockedTime },
            '[chpr-blocked] Process blocked for an excessive amount of time');
        }
        startTime = process.hrtime();
      }, CHECK_INTERVAL);
    }, this.delay);
    return this;
  }

  /**
   * Stops the monitoring. No more errors will be reported unless it's started again.
   *
   * @returns {BlockedMonitor} the instance, for chainability.
   */
  stop() {
    if (!this.running) {
      throw new Error('Invalid state: not running');
    }

    this.running = false;
    clearInterval(this._intervalId);
    return this;
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

/**
 * Create, starts and return an instance of BlockedMonitor, using configuration
 * from the environment: BLOCKED_DELAY and BLOCKED_THERSHOLD variables.
 *
 * @param {Object} env The environment to use, most likely process.env.
 * @returns {BlockedMonitor} The instance in running state.
 */
function startInstanceFromEnv(env) {
  const delay = getIntFromEnv(env, 'BLOCKED_DELAY', 2000);
  const threshold = getIntFromEnv(env, 'BLOCKED_THERSHOLD', 100);
  const instance = new BlockedMonitor(delay, threshold);
  return instance.start();
}

const singletton = startInstanceFromEnv(process.env);

module.exports = {
  BlockedMonitor,
  stop() {
    singletton.stop();
    return module.exports;
  },

  // exported for tests
  getIntFromEnv,
  singletton
};
