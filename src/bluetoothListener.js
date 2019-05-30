const role = require('../src/role');
const config = require('../config');

const BeaconScanner = require('../lib/bscanner');
const utils = require('../lib/utils');
const logger = require('../lib/logger');

const mastersName = Object.keys(config.accessPoints).find(apName => config.accessPoints[apName].url);
const masterIp = config.accessPoints[mastersName].url;
if (!masterIp) {
  utils.exit(`Cannot find master url un accessPoint definition`);
}

module.exports.init = function() {
  const scanner = new BeaconScanner();
  scanner.onSignal = (peripheral) => {
    const standardizedMac = utils.standardizeMac(peripheral.uuid);
    if (config.beacons.includes(standardizedMac)) {
      return informMaster(standardizedMac, peripheral.rssi);
    }
    logger.log(`Non registered peripheral ${standardizedMac} ${peripheral.rssi}`, logger.VERBOSE);
  };

  logger.log('...initializing bluetooth listener');
  scanner.startScan()
    .then(() => logger.log('Listener ready'))
    .catch(error => logger.error(error));
};

function informMaster(mac, rssi) {
  const masterUrl = `http://${masterIp}:${config.port}/notify/${role.whoami}/${mac}/${rssi}`;
  logger.log(`Beacon found - call master ${masterUrl}`, logger.DEBUG);

  return utils.getHttp(masterUrl);
}
