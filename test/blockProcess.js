'use strict';

/**
 * Blocks the event loop for a number of milliseconds
 *
 * @param {Number} duration the number of milliseconds
 * @returns {void}
 */
function blockProcess(duration) {
  const start = Date.now();
  while (Date.now() < start + duration) {
    // block the process
  }
}

module.exports = blockProcess;
