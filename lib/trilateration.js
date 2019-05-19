const trilateration = require('node-trilateration');

const config = require('../config');

/**
 * Distance = 10 ^ ((Measured Power – RSSI)/(10 * N))
 * https://iotandelectronics.wordpress.com/2016/10/07/how-to-calculate-distance-from-the-rssi-value-of-the-ble-beacon/
 */
function rssiToMeters(rssi) {
  return Math.pow(10, ((config.oneMeterToBeaconRssi - rssi) / (10 * 2)));
}

/**
 * @param {Object} data BeaconName => rssi
 * @return Object({x: number, y: number})
 */
function findCoordinates(data) {
  const beacons = Object.keys(data).map((beaconName) => ({
    x: config.accessPoints[beaconName].x,
    y: config.accessPoints[beaconName].y,
    distance: rssiToMeters(data[beaconName].rssi)
  }));

  return trilateration.calculate(beacons);
}

module.exports.rssiToMeters = rssiToMeters;
module.exports.findCoordinates = findCoordinates;
