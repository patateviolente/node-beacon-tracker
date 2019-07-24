import * as Promise from 'bluebird';

import * as Bpairing from '../../src/lib/bpairing';

import * as logger from '../lib/logger';

const maxBeepDuration = 10;
const minBeepDuration = 5;

global.Promise = Promise;

export class TrackerAlarm {
  constructor(peripheral, beaconConfig) {
    this.peripheral = peripheral;
    this.beaconConfig = beaconConfig;
    this.pair = new Bpairing(this.peripheral);
  }

  updateTiming(distance) {
    this._timing = {};
    this._timing.beepDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return this._timing;
  }

  play() {
    return Promise.try(() => {
      if (this.peripheral.state === 'connected') return;

      return this.pair.connect();
    })
      .then(() => this._alarmOn(this._timing.beepDuration))
      .delay(this._timing.beepDuration * 1000)
      .then(() => this._alarmOff())
      .catch(logger.error)
      .finally(() => this.stop()
        .then(() => this._restartListener()));
  }

  stop() {
    return this.pair.disconnect()
      .catch(logger.error);
  }

  _restartListener() {
    const bluetoothListener = require('./bluetoothListener');

    return bluetoothListener.scan();
  }

  _alarmOn(duration) {
    const pairConfig = this.beaconConfig.pair;
    if (!pairConfig) {
      return Promise.reject('pair config unset');
    }

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log(`[P] play alarm for ${duration} seconds`, logger.DEBUG))
      .then(characteristic => pairConfig.enable(characteristic));
  }

  _alarmOff() {
    const pairConfig = this.beaconConfig.pair;
    if (!pairConfig) {
      return Promise.reject('pair config unset');
    }

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log('[-] stop alarm', logger.DEBUG))
      .then(characteristic => pairConfig.disable(characteristic));
  }
}
