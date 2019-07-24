import * as utils from './lib/utils';

export const config = {
  port: 5552,
  ble_throttle: 200,
  // Tora nRF52840  d2:be:73:87:70:db
  // Tora Nut gris  71:bc:23:4c:72:5b
  beacons: [
    {
      name: 'Tora_Nut',
      mac: '71:bc:23:4c:72:5b',
      reference: {
        distance: 5,
        rssi: { pi1: -72, pi2: -79, pi3: -80 }
      },

      aggregate: { strategy: 'continuous' },
      pair: {
        service: '0000ff0000001000800000805f9b34fb',
        characteristic: '0000ff0100001000800000805f9b34fb',
        enable: characteristic => characteristic.writeAsync(Buffer.from('04', 'hex'), false),
        disable: characteristic => characteristic.writeAsync(Buffer.from('03', 'hex'), false)
      }
    }
  ],
  // Default aggregate values for beacons
  aggregate: {
    timeout: 15000, // Maximum time we wait all ap measures in 'when_available' strategy
    interval: 12000, // Time between each position event in 'continuous' strategy
    // 'when_available'  will process position when all ap has responded
    // 'continuous'      will process position every 'interval' time
    strategy: 'continuous',
    // Will set a value when one AP is missing
    approximate: [
      { missing: 'pi3', rssi: -92 },
    ]
  },
  accessPoints: {
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0.5,
      y: 8
    },
    pi2: { x: 0, y: 0 },
    pi3: { x: 7.5, y: 9 },
  },
  runawayBounds: [
    [[-Infinity, -Infinity], [-1, 8]],
  ],
  runawayCondition: pool => pool.pi2 > -95 && pool.pi3 > -95,
  dashboard: {
    autosaveInterval: 900 * 1000,
    port: 5553,
    base: '/home/pi/tracking/'
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
