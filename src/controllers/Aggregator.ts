import * as utils from '../lib/utils';
import * as logger from '../lib/logger';
import * as trilateration from '../lib/trilateration';

import Tracker from './Tracker';

import {config} from '../config';
import Timeout = NodeJS.Timeout;
import {Peripheral} from "noble";

const apNames = Object.keys(config.accessPoints);

let aggregates = {};

enum Strategy {
  continuous = 'continuous',
  when_available = 'when_available'
}

export default class Aggregator {
  private responsePools: { [apName: string]: string; };
  private timeout: Timeout;
  private interval: Timeout;
  private beaconConfig: any;
  private currentStrategy: Strategy;
  private tracker: Tracker;
  private aggregateConfig: any;

  constructor(beaconConfig: any) {
    this.beaconConfig = beaconConfig;
    this.responsePools = {};
    this.currentStrategy = config.aggregate.strategy;
    this.tracker = null;
    this.aggregateConfig = Object.assign({}, config.aggregate, beaconConfig.aggregate || {});

    this.setStrategy();
  }

  static byMAC(mac) {
    return aggregates[utils.standardizeMac(mac)];
  }

  static instantiateAll() {
    aggregates = config.beacons.reduce((aggregates, beaconConfig) => {
      aggregates[beaconConfig.mac] = new Aggregator(beaconConfig);

      return aggregates;
    }, {});
  }

  addPeripheral(peripheral: Peripheral) {
    if (!this.tracker) {
      const tracker = new Tracker(peripheral, this.beaconConfig);

      // When alarm is ringing, devices is paired and no position can be emitted
      tracker.on('alarm', (alarmDuration) => {
        this.resetTimers();
        logger.log(`inhibit aggregator for ${alarmDuration} seconds`, logger.DEBUG);
        setTimeout(() => this.setStrategy(), alarmDuration * 1000);
      });

      this.tracker = tracker;
    }
  }

  setStrategy(strategy: Strategy = this.aggregateConfig.strategy) {
    this.currentStrategy = strategy;
    this.resetTimers();
    this.responsePools = {};
    logger.log(`strategy set to ${strategy}`);

    if (this.currentStrategy === 'continuous') {
      this.interval = setInterval(() => this.aggregate(), config.aggregate.interval);
    }
  }

  private resetTimers() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
    this.responsePools = {};
  }

  slaveReport(apName, rssi) {
    clearTimeout(this.timeout);
    const pool = this.responsePools;

    // AP already responded
    if (this.currentStrategy === 'when_available') {
      this.timeout = setTimeout(() => this.aggregate(), config.aggregate.timeout);
    }

    // Save the signal / update with best signal
    if (!pool[apName] || rssi > pool[apName]) {
      pool[apName] = rssi;
    }

    if (this.currentStrategy === 'when_available' && apNames.length === Object.keys(pool).length) {
      this.aggregate();
    }
  }

  aggregate() {
    const pool = this.responsePools;
    const hasResponses = Object.keys(pool).length;

    // No response at all / Master is not initialized yet
    if (!hasResponses || !this.tracker) {
      return;
    }

    const {missingAPs} = this.partialPosition(pool);
    clearTimeout(this.timeout);
    this.responsePools = {};

    if (missingAPs.length) {
      return this.tracker.partialData(pool);
    }

    const coords = trilateration.findCoordinates(this.beaconConfig, pool);

    return this.tracker.newPosition(coords, pool);
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
