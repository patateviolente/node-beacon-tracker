import * as utils from './utils/strings';

import { Bounds } from './lib/geo/RunawayBounds';
import { AggregateConfig, Pool } from './controllers/watch/Aggregator';

export type BeaconConfig = {
  name: string,
  mac: string,
  reference: {
    distance: number,
    rssi: { [apName: string]: number },
  },
  aggregate: any,
  pair: any,
};

export type AccessPointConfig = {
  x: number,
  y: number,
  master?: boolean,
  url?: string,
};

export type TrackerConfig = {
  mode: 'coordinates' | 'manual',
  precisionCondition: Function,
  runawayBounds: Bounds,
};

export const config: any = {
  port: 5552,
  ble_throttle: 200,
  // Tora nRF52840  d2:be:73:87:70:db
  // Tora Nut gris  71:bc:23:4c:72:5b
  beacons: <BeaconConfig[]>[{
    name: 'Tora_Nut',
    mac: '71:bc:23:4c:72:5b',
    reference: {
      distance: 5,
      rssi: { pi1: -72, pi2: -79, pi3: -80 },
    },

    aggregate: { strategy: 'continuous' },
    pair: {
      service: '0000ff0000001000800000805f9b34fb',
      characteristic: '0000ff0100001000800000805f9b34fb',
      enable: characteristic => characteristic.writeAsync(Buffer.from('03', 'hex'), false),
      disable: characteristic => characteristic.writeAsync(Buffer.from('03', 'hex'), false),
    },
  }],
  // Default aggregate values for beacons
  aggregate: <AggregateConfig>{
    timeout: 15000, // Maximum time we wait all ap measures in 'when_available' strategy
    interval: 12000, // Time between each position event in 'continuous' strategy
    // 'when_available'  will process position when all ap has responded
    // 'continuous'      will process position every 'interval' time
    strategy: 'continuous',
    // Will set a value when one AP is missing
    approximate: [
      { missing: 'pi3', rssi: -92 },
    ],
  },
  accessPoints: <{ [apName: string]: AccessPointConfig }>{
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0.5,
      y: 8,
    },
    pi2: { x: 0, y: 0 },
    pi3: { x: 7.5, y: 9 },
    pi4: { x: 4, y: 8 },
  },
  tracker: <TrackerConfig>{
    mode: 'coordinates',
    precisionCondition: pool => pool.pi2 > -95 && pool.pi3 > -95,
    runawayBounds: <Bounds>[
      [[-Infinity, -Infinity], [-1, 8]],
    ],
  },
  // Optionally label a specific zone name according metrics
  zoneFinder: {
    enable: true,
    // Zone side to side, will prevent impossible measure once
    adjacent: {
      home_tora: ['roof_tora', 'roof_caly'],
      roof_tora: ['home_tora', 'roof_*', 'balcony_caly'],
      roof_caly: ['home_tora', 'roof_*', 'home_caly', 'balcony_caly'],
      roof_virigine: ['roof_*'],
      roof_technical: ['roof_*'],
      root_nocat_limit: ['roof_*', 'nocat_flag'],
      nocat_flag: ['roof_*'],
      caly_balcony: ['home_caly', 'roof_caly'],
      home_caly: ['balcony_caly'],
    },
    // Zone definition
    zones: [
      {
        name: 'home_tora',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 1 && pool.pi3;
        }
      },
      {
        name: 'roof_technical',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 3
            && pool.pi1 && pool.pi2 && pool.pi3
            && pool.pi3 < 10;
        }
      },
      {
        name: 'roof_virginie',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 2
            && pool.pi2 && pool.pi3;
        }
      },
      {
        name: 'root_nocat_limit',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 2
            && pool.pi1 && pool.pi2
            && pool.pi2 > pool.pi1;
        }
      },
      {
        name: 'nocat_flag',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 1 && pool.pi2;
        }
      },
      {
        name: 'roof_tora',
        context: (pool: Pool) => {
          return Object.keys(pool).length >= 2
            && pool.pi1 && pool.pi3
            && pool.pi3 > pool.pi1;
        }
      },
      {
        name: 'roof_caly',
        context: (pool: Pool) => {
          return Object.keys(pool).length >= 2
            && pool.pi1 && pool.pi3
            && pool.pi3 < pool.pi1;
        }
      },
      {
        name: 'balcony_caly',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 1 && pool.pi1
            || Object.keys(pool).length === 2 && pool.pi1 && pool.pi4;
        }
      },
      {
        name: 'home_caly',
        context: (pool: Pool) => {
          return Object.keys(pool).length === 1 && pool.pi4;
        }
      }
    ],
  },
  dashboard: {
    autosaveInterval: 900 * 1000,
    port: 5553,
    base: '/home/pi/tracking/',
  },
};

config.beacons.map((beacon) => {
  beacon.mac = utils.standardizeMac(beacon.mac);
});
config.beaconsMac = config.beacons.map(beacon => beacon.mac);
config.mastersName = Object.keys(config.accessPoints)
  .find(apName => config.accessPoints[apName].url);
config.masterIp = config.accessPoints[config.mastersName].url;
