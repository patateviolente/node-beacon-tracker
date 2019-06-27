const Promise = require('bluebird');
const Jetty = require('jetty');
const http = require('http');

const utils = require('./lib/utils');
const config = require('./config');
const BeaconScanner = require('./lib/bscanner');
const role = require('./src/role');

const jetty = new Jetty(process.stdout);
const stats = {};
const definedDevices = Object.values(config.beacons).map(({ mac }) => mac);

const startTime = new Date();
http.createServer(router).listen(config.port);
showStats();
listenLocalBeacons();

// Listen master
function listenLocalBeacons() {
  const scanner = new BeaconScanner();
  scanner.onSignal = (peripheral) => {
    const standardizedMac = utils.standardizeMac(peripheral.uuid);
    if (config.beaconsMac.includes(standardizedMac)) {
      const masterUrl = `http://${config.masterIp}:${config.port}/notify/${role.whoami}/${standardizedMac}/${peripheral.rssi}`;
      return utils.getHttp(masterUrl);
    }
  };

  scanner.startScan();
};


// Listen slaves
function router(req, res) {
  return Promise.try(() => {
    const url = req.url;
    res.end('{}');
    if (url.startsWith('/notify/')) {
      const notifyUrl = req.url.replace(/^\/notify\//, '');
      const params = notifyUrl.split('/');
      const [apName, mac, rssi] = params;

      // Transmitted /notify/apName/mac/rssi from slave
      if (Object.keys(config.accessPoints).includes(params[0])
        && utils.isNumeric(params[2])) {
        if (!stats[mac]) {
          stats[mac] = {};
        }
        if (!stats[mac][apName]) {
          stats[mac][apName] = [];
        }
        stats[mac][apName].push(parseInt(rssi));
        setTimeout(() => showStats(), 200);
      }
    }
  });
}

function showStats() {
  if (this.lastShow && ((new Date()).getTime() - this.lastShow.getTime()) < 1000) {
    return;
  }
  this.lastShow = new Date();

  let line = 0;
  const elaspedSeconds = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
  jetty.clear();
  jetty.moveTo([line++, 0]).text(`Benchmarking device in ${definedDevices.join(' ')} run ${elaspedSeconds}s\n`);

  Object.keys(stats).forEach((mac) => {
    jetty.moveTo([line++, 0]).text(`Device ${mac}:`);

    Object.keys(stats[mac]).sort().forEach((apName) => {
      const apRssi = stats[mac][apName].sort();
      const groupRssi = apRssi.reduce((groups, rssi) => {
        groups[rssi] = (groups[rssi] || 0) + 1;

        return groups;
      }, {});
      const formattedGroupRssi = Object.keys(groupRssi).reduce((str, rssi) => {
        return `${str} ${rssi}x${groupRssi[rssi]}`;
      }, '')
      const avg = Math.round(apRssi.reduce((sum, rssi) => sum + rssi, 0) / apRssi.length);
      const min = apRssi[0];
      const rate = Math.round((apRssi.length / elaspedSeconds) * 100) / 100;
      jetty.moveTo([line++, 0]).text(`[[${apName}]] ${apRssi.length} signals / min ${min} / avg ${avg} / every ${Math.round(1 / rate)}s`);
      jetty.moveTo([line++, 0]).text(`${formattedGroupRssi}`);
    });
  });
}
