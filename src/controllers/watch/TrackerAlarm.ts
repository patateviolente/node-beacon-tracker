import * as Promise from 'bluebird';
import { Peripheral } from 'noble';

import BluetoothPairing from '../../lib/bluetooth/BluetoothPairing';
import { scan } from '../listen/bluetoothListener';

import * as logger from '../../lib/logger';

import { BeaconConfig } from '../../config';

const maxBeepDuration = 10;
const minBeepDuration = 5;

/**
 * Handle device Alarm BLE connection
 * Aggregator -> Tracker -> TrackerAlarm
 */
export default class TrackerAlarm {
  private peripheral: Peripheral;
  private beaconConfig: BeaconConfig;
  private pair: BluetoothPairing;
  private alarmDuration: number;

  constructor(peripheral, beaconConfig: BeaconConfig) {
    this.peripheral = peripheral;
    this.beaconConfig = beaconConfig;
    this.pair = new BluetoothPairing(this.peripheral);
  }

  updateAlarmDuration(distance: number): number {
    this.alarmDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return this.alarmDuration;
  }

  play(): Promise<void> {
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

  stop(): Promise<any> {
    return this.pair.disconnect()
      .catch(logger.error);
  }

  private restartListener() {
    return scan();
  }

  private alarmOn(duration: number): Promise<void> {
    const pairConfig = this.beaconConfig.pair;
    if (!pairConfig) {
      return Promise.reject('pair config unset');
    }

    return this.pair.getService(pairConfig.service)
      .then(service => this.pair.getCharacteristic(service, pairConfig.characteristic))
      .tap(() => logger.log(`[P] play alarm for ${duration} seconds`, logger.LOGLEVEL.DEBUG))
      .then(characteristic => pairConfig.enable(characteristic));
  }

  private alarmOff(): Promise<void> {
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
