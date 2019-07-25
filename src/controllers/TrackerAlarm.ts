import * as Promise from 'bluebird';

import Bpairing from '../lib/BluetoothPairing';

import * as logger from '../lib/logger';
import {Peripheral} from "noble";

import {BeaconConfig} from '../config';

const maxBeepDuration = 10;
const minBeepDuration = 5;

export default class TrackerAlarm {
  private peripheral: Peripheral;
  private beaconConfig: BeaconConfig;
  private pair: Bpairing;
  private alarmDuration: number;

  constructor(peripheral, beaconConfig: BeaconConfig) {
    this.peripheral = peripheral;
    this.beaconConfig = beaconConfig;
    this.pair = new Bpairing(this.peripheral);
  }

  updateAlarmDuration(distance) {
    const alarmDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return alarmDuration;
  }

  play() {
    return Promise.try(() => {
      if (this.peripheral.state === 'connected') return;

      return this.pair.connect();
    })
      .then(() => this.alarmOn(this.alarmDuration))
      .delay(this.alarmDuration * 1000)
      .then(() => this.alarmOff())
      .catch(logger.error)
      .finally(() => this.stop()
        .then(() => this.restartListener()));
  }

  stop() {
    return this.pair.disconnect()
      .catch(logger.error);
  }

  private restartListener() {
    const bluetoothListener = require('./bluetoothListener');

    return bluetoothListener.scan();
  }

  private alarmOn(duration) {
    const pairConfig = this.beaconConfig.pair;
    if (!pairConfig) {
      return Promise.reject('pair config unset');
    }

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log(`[P] play alarm for ${duration} seconds`, logger.LOGLEVEL.DEBUG))
      .then(characteristic => pairConfig.enable(characteristic));
  }

  private alarmOff() {
    const pairConfig = this.beaconConfig.pair;
    if (!pairConfig) {
      return Promise.reject('pair config unset');
    }

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log('[-] stop alarm', logger.LOGLEVEL.DEBUG))
      .then(characteristic => pairConfig.disable(characteristic));
  }
}
