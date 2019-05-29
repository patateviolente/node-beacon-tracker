const utils = require('./lib/utils');

const config = {
  port: 5552,
  oneMeterToBeaconRssi: 60,
  beacons: ['71:bc:23:4c:72:5b'],
  accessPoints: {
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0,
      y: 0,
      height: 2
    },
    pi2: {
      x: 0.5,
      y: 8,
      height: 2
    },
    pi3: {
      x: 7.5,
      y: 9,
      height: 2
    }
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

config.beacons = config.beacons.map(mac => utils.standardizeMac(mac));

module.exports = config;
