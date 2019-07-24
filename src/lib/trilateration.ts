import * as trilateration from 'node-trilateration';

import * as config from '../config';

/**
 * Distance = 10 ^ ((Measured Power – RSSI)/(10 * N))
 * https://iotandelectronics.wordpress.com/2016/10/07/how-to-calculate-distance-from-the-rssi-value-of-the-ble-beacon/
 */
export function rssiToMeters(rssi, referenceRssi, referenceDistance = 1) {
  const meters = Math.pow(10, ((referenceRssi - rssi) / 20)) * referenceDistance;

  return Math.round(meters * 100) / 100;
}

/**
 * @param {Object} beaconConfig value in config.beacons
 * @param {Object} data BeaconName => rssi
 * @return Object({x: number, y: number})
 */
export function findCoordinates(beaconConfig, data) {
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
