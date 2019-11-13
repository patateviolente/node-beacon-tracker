import * as Promise from 'bluebird';
import { Peripheral } from 'noble';

import Aggregator from '../watch/Aggregator';

import BeaconScanner from '../../lib/bluetooth/BeaconScanner';
import * as logger from '../../lib/logger';

import * as httpUtils from '../../utils/http';
import * as stringUtils from '../../utils/strings';

import * as role from '../role';
import { config } from '../../config';

const scanner: BeaconScanner = new BeaconScanner();

const lastSignalPerMac = {};

export function init(): Promise<void> {
  scanner.on('signal', (peripheral: Peripheral) => {
    const standardizedMac = stringUtils.standardizeMac(peripheral.uuid);

    if (!config.beaconsMac.includes(standardizedMac)) {
      return logger.log(`Non registered peripheral ${standardizedMac} ${peripheral.rssi}`, logger.LOGLEVEL.EXPERIMENT);
    }

    const tooManySignals = (lastSignalPerMac[standardizedMac] || new Date()) + config.ble_throttle > new Date();
    if (tooManySignals) {
      return logger.log(`Throttle signal ${standardizedMac} ${peripheral.rssi}`, logger.LOGLEVEL.EXPERIMENT);
    }

    lastSignalPerMac[standardizedMac] = new Date();
    Aggregator.byMAC(standardizedMac).addPeripheral(peripheral);
    lastSignalPerMac[standardizedMac] = new Date();

    return informMaster(standardizedMac, peripheral.rssi)
      .catch(err => logger.error(`Cannot inform master ${err.message}`));
  });

  logger.log('...initializing bluetooth listener');
  return scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
}

export function scan() {
  return scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
}

function informMaster(mac, rssi) {
  const masterUrl = `http://${config.masterIp}:${config.port}/notify/${role.whoami}/${mac}/${rssi}`;
  logger.log(`Beacon found - call master ${masterUrl}`, role.role === 'master' ? logger.LOGLEVEL.EXPERIMENT : logger.LOGLEVEL.VERBOSE);

  return httpUtils.getURL(masterUrl);
}
