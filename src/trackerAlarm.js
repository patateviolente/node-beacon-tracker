const Promise = require('bluebird');

const Bpairing = require('../lib/bpairing');

const maxBeepDuration = 10;
const minBeepDuration = 5;

const logger = require('../lib/logger');

class TrackerAlarm {
  constructor(peripheral, beaconConfig) {
    this.peripheral = peripheral;
    this.beaconConfig = beaconConfig;
    this.pair = new Bpairing(this.peripheral);
    this.state = 'disconnected';
  }

  updateTiming(distance) {
    this._timing = {};
    this._timing.beepDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return this._timing;
  }

  play() {
    return Promise.try(() => {
      if (this.state.startsWith('connect')) return;
      this.state = 'connecting';

      return this.pair.connect();
    })
      .then(() => {
        this.state = 'connected';

        return this._alarmOn(this._timing.beepDuration);
      })
      .delay(this._timing.beepDuration * 1000)
      .then(() => this._alarmOff())
      .catch(logger.error)
      .finally(() => this.stop());
  }

  stop() {
    if (this.state.startsWith('disconnect')) {
      return Promise.resolve();
    }

    this.state = 'disconnecting';

    return this.pair.disconnect()
      .catch(logger.error)
      .finally(() => {
        const bluetoothListener = require('./bluetoothListener');
        this.state = 'disconnected';

        return bluetoothListener.scan();
      })
      .catch(logger.error);
  }

  _alarmOn(duration) {
    const pairConfig = this.beaconConfig.pair;

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log(`[P] play alarm for ${duration} seconds`, logger.DEBUG))
      .then(characteristic => pairConfig.enable(characteristic));
  }

  _alarmOff() {
    const pairConfig = this.beaconConfig.pair;

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log('[-] stop alarm', logger.DEBUG))
      .then(characteristic => pairConfig.disable(characteristic));
  }
}

module.exports = TrackerAlarm;
