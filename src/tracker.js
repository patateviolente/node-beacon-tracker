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
  }

  setPeripheral(peripheral) {
    this.peripheral = peripheral;
    this.alarm = new TrackerAlarm(peripheral);
  }

  partialData(missingAps, responses) {
    logger.log(`partial position ${JSON.stringify(responses)}`, 2);
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
    this.alarm.updateTiming(distFromZone);
    this.alarm.play();
    logger.log(`Forbidden position ${JSON.stringify(coords)}`);
  }

  _disarm() {
    const escapeTime = ((new Date()).getTime() - this.outSince.getTime()) / 1000;
    this.alert = false;
    this.outSince = null;
    logger.log(`Escape is over after ${escapeTime}s escape`);

    return this.peripheral.disconnect();
  }
}

class TrackerAlarm {
  constructor(peripheral, mode = 'once') {
    this.peripheral = peripheral;
    this.mode = mode;
    this.pair = new Bpairing(this.peripheral);
    this.state = 'disconnected';
  }

  isPlaying() {
    return this.state.startsWith('connect');
  }

  updateTiming(distance) {
    this._timing = {};
    this._timing.sleep = Math.max(Math.min(10 / distance, 4), 1);
    this._timing.alarmDuration = alarmDuration - this._timing.sleep;
  }

  play() {
    if (this.isPlaying()) {
      return;
    }

    this.state = 'connecting';

    return this.pair.connect()
      .then(() => {
        this.state = 'connected';
        this._alarmOn()
      })
  }

  pause() {
    if (this.state.startsWith('connect')) {
      this.state = 'disconnecting';

      return this.pair.disconnect()
        .then(() => {
          this.state = 'disconnected';
        });
    }
  }

  _alarmOn() {
    setTimeout(() => this._alarmOff(), this._timing.sleep * 1000);
  }

  _alarmOff() {
    // Cannot analyse position en pair both the same time
    return this.pause();

    // TODO ring continuously until pause() is called when mode === 'continuous'
  }

}

module.exports = new Tracker();
