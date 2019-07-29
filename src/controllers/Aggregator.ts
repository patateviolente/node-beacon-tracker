import * as Promise from 'bluebird';

import * as utils from '../utils/strings';
import * as logger from '../lib/logger';
import * as trilateration from '../lib/trilateration';

import Tracker from './Tracker';

import {BeaconConfig, config} from '../config';
import Timeout = NodeJS.Timeout;
import {Peripheral} from "noble";

const apNames = Object.keys(config.accessPoints);

type AggregatorIndex = { [mac: string]: Aggregator };
let aggregates: AggregatorIndex = {};

export enum Strategies {
  continuous = 'continuous',
  when_available = 'when_available'
}

export type TRssiPool = { [apName: string]: number; };

export type AggregateConfig = {
  timeout: number,
  interval: number,
  strategy: Strategies,
  approximate: { missing: string, rssi: number }[]
};

export default class Aggregator {
  private rssiPool: { [apName: string]: number; };
  private timeout: Timeout;
  private interval: Timeout;
  private beaconConfig: any;
  private currentStrategy: Strategies;
  private tracker: Tracker;
  private aggregateConfig: any;

  constructor(beaconConfig: BeaconConfig) {
    this.beaconConfig = beaconConfig;
    this.rssiPool = {};
    this.currentStrategy = config.aggregate.strategy;
    this.tracker = null;
    this.aggregateConfig = Object.assign({}, config.aggregate, beaconConfig.aggregate || {});

    this.setStrategy();
  }

  static byMAC(mac): Aggregator {
    return aggregates[utils.standardizeMac(mac)];
  }

  static instantiateAll(): void {
    aggregates = config.beacons.reduce((aggregates: AggregatorIndex, beaconConfig: BeaconConfig): AggregatorIndex => {
      aggregates[beaconConfig.mac] = new Aggregator(beaconConfig);

      return aggregates;
    }, {});
  }

  addPeripheral(peripheral: Peripheral): this {
    if (!this.tracker) {
      const tracker = new Tracker(peripheral, this.beaconConfig);

      // When alarm is ringing, devices is paired and no position can be emitted
      tracker.on('alarm', (alarmDuration) => {
        this.resetTimers();
        logger.log(`inhibit aggregator for ${alarmDuration} seconds`, logger.LOGLEVEL.DEBUG);
        setTimeout(() => this.setStrategy(), alarmDuration * 1000);
      });

      this.tracker = tracker;
    }

    return this;
  }

  setStrategy(strategy: Strategies = this.aggregateConfig.strategy): this {
    this.currentStrategy = strategy;
    this.resetTimers();
    this.rssiPool = {};
    logger.log(`strategy set to ${strategy}`);

    if (this.currentStrategy === 'continuous') {
      this.interval = setInterval(() => this.aggregate(), config.aggregate.interval);
    }

    return this;
  }

  private resetTimers(): this {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
    this.rssiPool = {};

    return this;
  }

  slaveReport(apName: string, rssi: number) {
    clearTimeout(this.timeout);

    // Save the signal / update with best signal
    if (!this.rssiPool[apName] || rssi > this.rssiPool[apName]) {
      this.rssiPool[apName] = rssi;
    }

    if (this.currentStrategy === 'when_available') {
      this.timeout = setTimeout(() => this.aggregate(), config.aggregate.timeout);

      if (apNames.length === Object.keys(this.rssiPool).length) {
        return this.aggregate();
      }
    }
  }

  aggregate(): Promise<unknown> {
    const pool = this.rssiPool;
    const hasResponses = Object.keys(pool).length;

    // No response at all / Master is not initialized yet
    if (!hasResponses || !this.tracker) {
      return;
    }

    const {missingAPs} = this.partialPosition(pool);
    clearTimeout(this.timeout);
    this.rssiPool = {};

    if (missingAPs.length) {
      return this.tracker.partialData(pool);
    }

    return this.tracker.newPosition(
      trilateration.findCoordinates(this.beaconConfig, pool),
      pool
    );
  }

  private partialPosition(pool) {
    const approximateConfig = config.aggregate.approximate;
    let missingAPs = apNames.reduce((missing, apName) => {
      if (!pool[apName]) {
        missing.push(apName);
      }

      return missing;
    }, []);

    if (missingAPs.length === 1) {
      for (const approxConfig of approximateConfig) {
        if (approxConfig.missing === missingAPs[0]) {
          logger.log(`Faking ${approxConfig.missing} with ${approxConfig.rssi} - too far`);

          pool[approxConfig.missing] = approxConfig.rssi;
          missingAPs = [];
        }
      }
    }

    return {missingAPs}
  }
}