const Promise = require('bluebird');

const utils = require('./lib/utils');

const config = {
  port: 5552,
  beacons: {
    // Tora nRF52840  d2:be:73:87:70:db
    // Tora Nut gris  71:bc:23:4c:72:5b
    tora: {
      mac: '71:bc:23:4c:72:5b',
      reference: {
        distance: 3,
        rssi: { pi1: -59, pi2: -66, pi3: -66 }
      },
      pair: {
        characteristic: {
          match: { uuid: '000015251212efde1523785feabcd123' },
          enable: (characteristic) => {
            return Promise.promisify(characteristic.write).write(Buffer.from('1'), true);
          }
        },
      }
    }
  },
  aggregate: {
    timeout: 10000, // Maximum time we wait all ap measures
    interval: 5000, // Time between each position event in 'continuous' strategy
    // 'when_available'  will process position when all ap has responded
    // 'continuous'      will process position every 'interval' time
    strategy: 'continuous'
  },
  accessPoints: {
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0,
      y: 0,
    },
    pi2: { x: 0.5, y: 8 },
    pi3: { x: 7.5, y: 9 },
  },
  runawayBounds: [
    [[-Infinity, -Infinity], [Infinity, Infinity]],
    [[-Infinity, -Infinity], [-1, 8]],
    [[9, -Infinity], [Infinity, 8]]
  ],
  dashboard: {
    enable: true,
    port: 5553,
    map: {
      src: 'img/maps/map.jpg',
      xi: -22,
      xf: 45.5,
      yi: -6,
      yf: 29.3,
    }
  }
};

Object.values(config.beacons).map((beacon) => {
  beacon.mac = utils.standardizeMac(beacon.mac);
});
config.beaconsMac = Object.values(config.beacons).map((beacon) => beacon.mac);
config.mastersName = Object.keys(config.accessPoints).find(apName => config.accessPoints[apName].url);
config.masterIp = config.accessPoints[config.mastersName].url;
if (!config.masterIp) {
  utils.exit(`Cannot find master url un accessPoint definition`);
}

module.exports = config;