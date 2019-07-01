const Promise = require('bluebird');

const config = require('../config');

const logger = require('../lib/logger');
const RunawayBounds = require('../lib/runawayBounds');

const Bpairing = require('../lib/bpairing');

const alarmDuration = 5;

class Tracker {
  constructor() {
    this.alert = false;
    this.outSince = null;
    this.bounds = new RunawayBounds(config.runawayBounds);
    this.timeoutAlert = null;
    this.timeoutSleep = null;
  }

  setPeripheral(peripheral) {
    this.peripheral = peripheral;
  }

  newPosition(coords) {
    const distFromZone = this.bounds.distancefromZone(coords);
    const isAllowed = distFromZone > 0;

    // No alert
    if (isAllowed) {
      logger.log(`Position ok ${JSON.stringify(coords)}`);
      if (this.alert) {
        return this._disarm();
      }
    }

    // Update alert timing
    if (this.alert) {
      return this._updateTiming(distFromZone);
    }

    this._runAlert();
    logger.log(`Forbidden position ${JSON.stringify(coords)}`);
  }

  _disarm() {
    const escapeTime = ((new Date()).getTime() - this.outSince.getTime()) / 1000;
    this.alert = false;
    this.outSince = null;
    logger.log(`Escape is over after ${escapeTime}s escape`);

    return this.peripheral.disconnect();
  }

  _updateTiming(distance) {
    this._timing = {};
    this._timing.sleep = Math.max(Math.min(10 / distance, 4), 1);
    this._timing.alarmDuration = alarmDuration - this._timing.sleep;
  }

  _runAlert() {
    return new Bpairing()
    this.alert = true;
    this._alarmOn();
  }

  _alarmOn() {
    this.timeoutAlert = setTimeout(() => this._alarmOff(), this._timing.sleep * 1000);

    return this.
  }

  _alarmOff() {
    this.timeoutAlert = setTimeout(() => this._alarmOn(), this._timing.sleep * 1000);
    this.timeoutSleep = setTimeout(() => this._alarmOn(), this._timing.sleep * 1000);
  }

  _alarmSleep() {

  }

  partialData(missingAps, responses) {
    logger.log(`partial position ${JSON.stringify(responses)}`, 2);
  }
}

module.exports = new Tracker();
