const utils = require('./lib/utils');

const config = {
  port: 5552,
  ble_throttle: 200,
  // Tora nRF52840  d2:be:73:87:70:db
  // Tora Nut gris  71:bc:23:4c:72:5b
  beacons: [
    {
      name: 'Tora_Nut',
      mac: '71:bc:23:4c:72:5b',
      reference: {
        distance: 1,
        rssi: { pi1: -54, pi2: -63, pi3: -64 }
      },

      aggregate: { strategy: 'continuous' },
      pair: {
        service: '0000ff0000001000800000805f9b34fb',
        characteristic: '0000ff0100001000800000805f9b34fb',
        enable: characteristic => characteristic.writeAsync(Buffer.from('03', 'hex'), false),
        disable: characteristic => characteristic.writeAsync(Buffer.from('03', 'hex'), false)
      }
    }
  ],
  // Default aggregate values for beacons
  aggregate: {
    timeout: 12000, // Maximum time we wait all ap measures in 'when_available' strategy
    interval: 4500, // Time between each position event in 'continuous' strategy
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

config.beacons.map((beacon) => {
  beacon.mac = utils.standardizeMac(beacon.mac);
});
config.beaconsMac = config.beacons.map((beacon) => beacon.mac);
config.mastersName = Object.keys(config.accessPoints).find(apName => config.accessPoints[apName].url);
config.masterIp = config.accessPoints[config.mastersName].url;

if (!config.masterIp) {
  utils.exit(`Cannot find master url un accessPoint definition`);
}

module.exports = config;