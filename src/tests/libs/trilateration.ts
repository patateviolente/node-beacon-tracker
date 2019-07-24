import {expect} from 'chai';

import {config} from '../../config';
import * as trilateration from '../../lib/trilateration';

describe('Trilateration lib', () => {
  const originalAPConfig = config.accessPoints;
  after(() => {
    config.accessPoints = originalAPConfig;
  });

  it('should convert rssi to meters with oneMeterToBeaconRssi', () => {
    const oneMeterToBeaconRssi = -52;
    const expectedDistances = fillRange(-99, -32);
    const results = expectedDistances.reduce((acc, rssi) => {
      acc[`rssi${rssi}`] = trilateration.rssiToMeters(rssi, oneMeterToBeaconRssi);

      return acc;
    }, {});

    expect(results).to.eql({
      'rssi-99': 223.87,
      'rssi-98': 199.53,
      'rssi-97': 177.83,
      'rssi-96': 158.49,
      'rssi-95': 141.25,
      'rssi-94': 125.89,
      'rssi-93': 112.2,
      'rssi-92': 100,
      'rssi-91': 89.13,
      'rssi-90': 79.43,
      'rssi-89': 70.79,
      'rssi-88': 63.1,
      'rssi-87': 56.23,
      'rssi-86': 50.12,
      'rssi-85': 44.67,
      'rssi-84': 39.81,
      'rssi-83': 35.48,
      'rssi-82': 31.62,
      'rssi-81': 28.18,
      'rssi-80': 25.12,
      'rssi-79': 22.39,
      'rssi-78': 19.95,
      'rssi-77': 17.78,
      'rssi-76': 15.85,
      'rssi-75': 14.13,
      'rssi-74': 12.59,
      'rssi-73': 11.22,
      'rssi-72': 10,
      'rssi-71': 8.91,
      'rssi-70': 7.94,
      'rssi-69': 7.08,
      'rssi-68': 6.31,
      'rssi-67': 5.62,
      'rssi-66': 5.01,
      'rssi-65': 4.47,
      'rssi-64': 3.98,
      'rssi-63': 3.55,
      'rssi-62': 3.16,
      'rssi-61': 2.82,
      'rssi-60': 2.51,
      'rssi-59': 2.24,
      'rssi-58': 2,
      'rssi-57': 1.78,
      'rssi-56': 1.58,
      'rssi-55': 1.41,
      'rssi-54': 1.26,
      'rssi-53': 1.12,
      'rssi-52': 1,
      'rssi-51': 0.89,
      'rssi-50': 0.79,
      'rssi-49': 0.71,
      'rssi-48': 0.63,
      'rssi-47': 0.56,
      'rssi-46': 0.5,
      'rssi-45': 0.45,
      'rssi-44': 0.4,
      'rssi-43': 0.35,
      'rssi-42': 0.32,
      'rssi-41': 0.28,
      'rssi-40': 0.25,
      'rssi-39': 0.22,
      'rssi-38': 0.2,
      'rssi-37': 0.18,
      'rssi-36': 0.16,
      'rssi-35': 0.14,
      'rssi-34': 0.13,
      'rssi-33': 0.11,
      'rssi-32': 0.1
    });
  });

  it('should work with a benchmark on any distance (1 meter, 2 meters...)', () => {
    const oneMeterToBeaconRssi = -50;
    const twoMetersToBeaconRssi = -56;
    expect(trilateration.rssiToMeters(-38, oneMeterToBeaconRssi, 1)).to.equal(0.25);
    expect(trilateration.rssiToMeters(-38, twoMetersToBeaconRssi, 2)).to.equal(0.25);
    expect(trilateration.rssiToMeters(-44, oneMeterToBeaconRssi, 1)).to.equal(0.5);
    expect(trilateration.rssiToMeters(-44, twoMetersToBeaconRssi, 2)).to.equal(0.5);
    expect(trilateration.rssiToMeters(-50, oneMeterToBeaconRssi, 1)).to.equal(1);
    expect(trilateration.rssiToMeters(-50, twoMetersToBeaconRssi, 2)).to.equal(1);
    expect(trilateration.rssiToMeters(-56, oneMeterToBeaconRssi, 1)).to.equal(2);
    expect(trilateration.rssiToMeters(-56, twoMetersToBeaconRssi, 2)).to.equal(2);
    expect(trilateration.rssiToMeters(-62, oneMeterToBeaconRssi, 1)).to.equal(3.98);
    expect(trilateration.rssiToMeters(-62, twoMetersToBeaconRssi, 2)).to.equal(3.99);
    expect(trilateration.rssiToMeters(-68, oneMeterToBeaconRssi, 1)).to.equal(7.94);
    expect(trilateration.rssiToMeters(-68, twoMetersToBeaconRssi, 2)).to.equal(7.96);
  });

  it('should calculate coordinates', () => {
    // 0|_0 1 2 3 4 5 6
    // 1| - - - x - - -
    // 2| - - - - - - -
    // 3| - x - o - x -
    config.accessPoints = {
      ap1: {x: 3, y: 0},
      ap2: {x: 1, y: 2},
      ap3: {x: 5, y: 2}
    };
    const coords = trilateration.findCoordinates({
      mac: '112233445566',
      reference: {
        distance: 1,
        rssi: {ap1: -40, ap2: -42, ap3: -39}
      }
    }, {ap1: -40, ap2: -42, ap3: -39});
    expect(coords).to.eql({x: 3, y: 2})
  });
});

const fillRange = (start: number, end: number) => {
  // @ts-ignore
  return Array(end - start + 1).fill()
    .map((item, index) => start + index);
};
