const trilateration = require('node-trilateration');

const config = require('../config');

/**
 * Distance = 10 ^ ((Measured Power – RSSI)/(10 * N))
 * https://iotandelectronics.wordpress.com/2016/10/07/how-to-calculate-distance-from-the-rssi-value-of-the-ble-beacon/
 */
function rssiToMeters(rssi, referenceRssi, referenceDistance = 1) {
  const meters = Math.pow(10, ((referenceRssi - rssi) / 20)) * referenceDistance;

  return Math.round(meters * 100) / 100;
}

/**
 * @param {Object} beaconConfig value in config.beacons
 * @param {Object} data BeaconName => rssi
 * @return Object({x: number, y: number})
 */
function findCoordinates(beaconConfig, data) {
  const beacons = Object.keys(data).map((beaconName) => ({
    x: config.accessPoints[beaconName].x,
    y: config.accessPoints[beaconName].y,
    distance: rssiToMeters(
      data[beaconName],
      beaconConfig.reference.rssi[beaconName],
      beaconConfig.reference.distance[beaconName]
    )
  }));

  return trilateration.calculate(beacons);
}

module.exports.rssiToMeters = rssiToMeters;
module.exports.findCoordinates = findCoordinates;
