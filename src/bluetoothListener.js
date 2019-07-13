const role = require('../src/role');
const Aggregator = require('../src/aggregator');
const config = require('../config');

const BeaconScanner = require('../lib/bscanner');
const utils = require('../lib/utils');
const logger = require('../lib/logger');

const scanner = new BeaconScanner();

module.exports.init = function() {
  scanner.onSignal = (peripheral) => {
    const standardizedMac = utils.standardizeMac();
    Aggregator.byMAC(standardizedMac).addPeripheral(peripheral);

    if (config.beaconsMac.includes(standardizedMac)) {
      return informMaster(standardizedMac, peripheral.rssi)
        .catch(err => logger.error(`Cannot inform master ${err.message}`));
    }
    logger.log(`Non registered peripheral ${standardizedMac} ${peripheral.rssi}`, logger.VERBOSE);
  };

  logger.log('...initializing bluetooth listener');
  scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
};

module.exports.scan = () => {
  return scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
};

function informMaster(mac, rssi) {
  const masterUrl = `http://${config.masterIp}:${config.port}/notify/${role.whoami}/${mac}/${rssi}`;
  logger.log(`Beacon found - call master ${masterUrl}`, logger.DEBUG);

  return utils.getHttp(masterUrl);
}
