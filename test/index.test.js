'use strict';

const exec = require('child_process').exec;
const logger = require('chpr-logger');
const expect = require('chai').expect;
const sandbox = require('sinon').sandbox.create();

const chprBlocked = require('../index');
const blockProcess = require('./blockProcess');


/**
 * Returns a promise that will be resolved after a number of milliseconds.
 *
 * @param {Number} duration the number of milliseconds
 * @returns {Promise<void>} the promise
 */
function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

describe('chprBlocked', () => {
  let logErrorStub;

  beforeEach(() => {
    logErrorStub = sandbox.stub(logger, 'error');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('singleton', () => {
    it('should not be running at startup', () => {
      expect(chprBlocked.singleton).to.be.an.instanceOf(chprBlocked.BlockedMonitor);
      expect(chprBlocked.singleton).to.have.property('running', false);
    });
  });

  describe('getIntFromEnv()', () => {
    it('should return the default value when name not in env', () => {
      const value = chprBlocked.getIntFromEnv({}, 'sdqjhezah', 42);
      expect(value).to.equal(42);
      expect(logErrorStub.callCount).to.equal(0);
    });

    it('should return the default value and log an error in case of parsing error', () => {
      const value = chprBlocked.getIntFromEnv({ test: 'sdjkskj' }, 'test', 42);
      expect(value).to.equal(42);
      expect(logErrorStub.callCount).to.equal(1);
    });

    it('should return the specified value when it\'s properly provided', () => {
      const value = chprBlocked.getIntFromEnv({ test: '43' }, 'test', 42);
      expect(value).to.equal(43);
      expect(logErrorStub.callCount).to.equal(0);
    });
  });

  describe('stop() and start()', () => {
    beforeEach(() => {
      sandbox.stub(process, 'env', { BLOCKED_DELAY: '200', BLOCKED_THERSHOLD: '100' });
    });

    afterEach(() => {
      if (chprBlocked.isRunning()) {
        chprBlocked.stop();
      }
    });

    it('should not log before delay', function* it() {
      chprBlocked.start('chpr-blocked tests');
      blockProcess(100);
      yield sleep(300);
      expect(logErrorStub.callCount).to.equal(0);
    });

    it('should not log before under threshold', function* it() {
      chprBlocked.start('chpr-blocked tests');
      yield sleep(300);
      blockProcess(50);
      yield sleep(300);
      expect(logErrorStub.callCount).to.equal(0);
    });

    it('should log after delay and above threshold', function* it() {
      chprBlocked.start('chpr-blocked tests');
      yield sleep(300);
      blockProcess(200);
      yield sleep(300);
      expect(logErrorStub.callCount).to.equal(1);
      expect(logErrorStub.args[0][0]).to.have.property('serviceName', 'chpr-blocked tests');
    });

    it('should not log after being stopped', function* it() {
      chprBlocked.start('chpr-blocked tests');
      yield sleep(300);
      blockProcess(200);
      chprBlocked.stop();
      yield sleep(300);
      expect(logErrorStub.callCount).to.equal(0);
    });

    it('should not accept to start when already running', () => {
      chprBlocked.start('chpr-blocked tests');
      expect(() => chprBlocked.start('chpr-blocked tests'))
        .to.throw(Error, /Invalid state: already running/);
    });

    it('should not accept to stop when not running', () => {
      expect(() => chprBlocked.stop()).to.throw(Error, /Invalid state: not running/);
    });
  });

  describe('Integration tests', () => {
    it('should monitor when requiring chpr-blocked and starting it', done => {
      exec(
        'node test/integration.start.test.txt',
        {
          env: Object.assign({}, process.env, {
            BLOCKED_DELAY: '0',
            BLOCKED_THERSHOLD: '50',
            LOGGER_LEVEL: 'error'
          })
        },
        (err, stdout, strerr) => {
          expect(strerr).to.have.length(0);
          expect(err).to.equal(null);
          const log = JSON.parse(stdout);
          expect(log).to.have.property('msg',
            '[chpr-blocked] Process blocked for an excessive amount of time');
          expect(log).to.have.property('level', 50);
          done();
        }
      );
    });

    it('should not monitor when requiring chpr-blocked without starting it', done => {
      exec(
        'node test/integration.test.txt',
        {
          env: Object.assign({}, process.env, {
            BLOCKED_DELAY: '0',
            BLOCKED_THERSHOLD: '50',
            LOGGER_LEVEL: 'error'
          })
        },
        (err, stdout, strerr) => {
          expect(strerr).to.have.length(0);
          expect(err).to.equal(null);
          expect(stdout).to.have.length(0);
          done();
        }
      );
    });
  });
});
