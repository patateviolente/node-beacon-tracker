const role = require('.//role');
const Aggregator = require('.//aggregator');
const config = require('../config');

const BeaconScanner = require('../lib/bscanner');
const utils = require('../lib/utils');
const logger = require('../lib/logger');

const scanner = new BeaconScanner();

const lastSignalPerMac = {};

export {
  init,
  scan
};

function init() {
  scanner.onSignal = (peripheral) => {
    const standardizedMac = utils.standardizeMac(peripheral.uuid);

    if (!config.beaconsMac.includes(standardizedMac)) {
      return logger.log(`Non registered peripheral ${standardizedMac} ${peripheral.rssi}`, logger.EXPERIMENT);
    }

    const tooManySignals = (lastSignalPerMac[standardizedMac] || new Date()) + config.ble_throttle > new Date();
    if (tooManySignals) {
      return logger.log(`Throttle signal ${standardizedMac} ${peripheral.rssi}`, logger.EXPERIMENT);
    }

    lastSignalPerMac[standardizedMac] = new Date();
    Aggregator.byMAC(standardizedMac).addPeripheral(peripheral);
    lastSignalPerMac[standardizedMac] = new Date();

    return informMaster(standardizedMac, peripheral.rssi)
      .catch(err => logger.error(`Cannot inform master ${err.message}`));
  };

  logger.log('...initializing bluetooth listener');
  scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
}

function scan() {
  return scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
}

function informMaster(mac, rssi) {
  const masterUrl = `http://${config.masterIp}:${config.port}/notify/${role.whoami}/${mac}/${rssi}`;
  logger.log(`Beacon found - call master ${masterUrl}`, role.amISlave ? logger.VERBOSE : logger.EXPERIMENT);

  return utils.getHttp(masterUrl);
}
