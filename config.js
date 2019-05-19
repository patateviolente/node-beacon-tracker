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
  ]
};

config.beacons = config.beacons.map(mac => utils.standardizeMac(mac));

module.exports = config;
