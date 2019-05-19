const role = require('../src/role');
const config = require('../config');
const BeaconScanner = require('../lib/bscanner');
const utils = require('../lib/utils');

const mastersName = Object.keys(config.accessPoints).find(apName => config.accessPoints[apName].url);
const masterIp = config.accessPoints[mastersName].url;
if (!masterIp) {
  utils.exit(`Cannot find master url un accessPoint definition`);
}

module.exports.init = function() {
  const scanner = new BeaconScanner();
  scanner.onSignal = (peripheral) => {
    console.log(peripheral.uuid);
    console.log(peripheral.rssi);

    return informMaster(utils.standardizeMac(peripheral.uuid), peripheral.rssi);
  };

  console.log('...initializing bluetooth listener');
  scanner.startScan()
    .then(() => console.log('Listener ready'))
    .catch(error => console.error(error));
};

function informMaster(mac, rssi) {
  const masterUrl = `http://${masterIp}:${config.port}/${role.whoami}/${mac}/${rssi}`;
  return utils.getHttp(masterUrl);
}
