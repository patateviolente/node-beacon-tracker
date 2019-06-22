const utils = require('./lib/utils');

const config = {
  port: 5552,
  beacons: {
    // tora_nut: {
    //   mac: '71:bc:23:4c:72:5b',
    //   reference: {
    //     distance: 1,
    //     rssi: { pi1: -53, pi2: -53, pi3: -53 }
    //   }
    // }
    tora: {
      mac: 'd2:be:73:87:70:db',
      reference: {
        distance: 1,
        rssi: { pi1: -53, pi2: -53, pi3: -53 }
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
    [[-100, -100], [-1, 8]],
    [[9, -100], [100, 8]]
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