const Promise = require('bluebird');
const Jetty = require('jetty');
const http = require('http');

const bluetoothServer = require('./src/bluetoothListener');
const utils = require('./lib/utils');
const config = require('./config');

const jetty = new Jetty(process.stdout);
const stats = {};
const definedDevices = Object.values(config.beacons).map(({ mac }) => mac);

const startTime = new Date();
bluetoothServer.init();
http.createServer(router).listen(config.port);
showStats();

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
        showStats();
      }
    }
  });
}

function showStats() {
  let line = 0;
  const elaspedSeconds = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
  jetty.clear();
  jetty.moveTo([line++, 0]).text(`Benchmarking device in ${definedDevices.join(' ')}\n`);

  Object.keys(stats).forEach((mac) => {
    jetty.moveTo([line++, 0]).text(`Device ${mac}:`);

    Object.keys(stats[mac]).forEach((apName) => {
      const apRssi = stats[mac][apName].sort();
      const avg = Math.round(apRssi.reduce((sum, rssi) => sum + rssi, 0) / apRssi.length);
      const min = apRssi[0];
      const rate = Math.round((apRssi.length / elaspedSeconds) * 100) / 100;
      jetty.moveTo([line++, 0]).text(` - ${apName}: ${apRssi.length} signals / min ${min} / avg ${avg} / every ${Math.round(1 / rate)}s`);
      jetty.moveTo([line++, 0]).text(`${apRssi}`);
    });
  });
}
