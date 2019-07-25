import * as Promise from 'bluebird';

import Bpairing from '../lib/bpairing';

import * as logger from '../lib/logger';
import {Peripheral} from "noble";

const maxBeepDuration = 10;
const minBeepDuration = 5;

export default class TrackerAlarm {
  private peripheral: Peripheral;
  private beaconConfig: any;
  private pair: Bpairing;
  private timing: any;

  // TODO create interface for config.beaconConfig
  constructor(peripheral, beaconConfig: any) {
    this.peripheral = peripheral;
    this.beaconConfig = beaconConfig;
    this.pair = new Bpairing(this.peripheral);
  }

  // TODO simplify timing / beepDuration
  updateTiming(distance) {
    this.timing = {};
    this.timing.beepDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return this.timing;
  }

  play() {
    return Promise.try(() => {
      if (this.peripheral.state === 'connected') return;

      return this.pair.connect();
    })
      .then(() => this._alarmOn(this.timing.beepDuration))
      .delay(this.timing.beepDuration * 1000)
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
    const bluetoothListener = require('../../todo/ts/bluetoothListener');

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
