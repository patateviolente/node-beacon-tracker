const utils = require('../lib/utils');
const logger = require('../lib/logger');
const trilateration = require('../lib/trilateration');

const Tracker = require('./tracker');

const config = require('../config');

let aggregates = {};

class BeaconAggregator {
  constructor(beaconConfig) {
    this.beaconConfig = beaconConfig;
    this._responsePools = {};
    this._timeout = null;
    this._continuousInterval = null;
    this._strategy = config.aggregate.strategy;
    this._tracker = null;
    this.aggregateConfig = Object.assign({}, config.aggregate, beaconConfig.aggregate || {});
    this.apNames = Object.keys(config.accessPoints);

    this.setStrategy();
  }

  static byMAC(mac) {
    return aggregates[utils.standardizeMac(mac)];
  }

  static instantiateAll() {
    aggregates = config.beacons.reduce((aggregates, beaconConfig) => {
      aggregates[beaconConfig.mac] = new BeaconAggregator(beaconConfig);

      return aggregates;
    }, {});
  }

  addPeripheral(peripheral) {
    if (!this._tracker) {
      const tracker = new Tracker(peripheral, this.beaconConfig);

      // When alarm is ringing, devices is paired and no position can be emitted
      tracker.on('alarm', (alarmDuration) => {
        this._resetTimers();
        logger.log(`inhibit aggregator for ${alarmDuration} seconds`, logger.DEBUG);

        // TODO move this into a new event
        setTimeout(() => this.setStrategy(), alarmDuration * 1000);
      });

      this._tracker = tracker;
    }
  }

  setStrategy(strategy = this.aggregateConfig.strategy) {
    this._strategy = strategy;
    this._resetTimers();
    this._responsePools = {};
    logger.log(`strategy set to ${strategy}`);

    if (this._strategy === 'continuous') {
      this._continuousInterval = setInterval(() => this.aggregate(), config.aggregate.interval);
    }
  }

  _resetTimers() {
    clearTimeout(this._timeout);
    clearInterval(this._continuousInterval);
    this._responsePools = {};
  }

  slaveReport(apName, rssi) {
    clearTimeout(this._timeout);
    const pool = this._responsePools;

    // AP already responded
    if (this._strategy === 'when_available') {
      this._timeout = setTimeout(() => this.aggregate(), config.aggregate.timeout);
    }

    // Save the signal / update with best signal
    if (!pool[apName] || rssi > pool[apName]) {
      pool[apName] = rssi;
    }

    if (this._strategy === 'when_available' && this.apNames.length === Object.keys(pool).length) {
      this.aggregate();
    }
  }

  aggregate() {
    const pool = this._responsePools;
    const hasResponses = Object.keys(pool).length;

    // No response at all / Master is not initialized yet
    if (!hasResponses || !this._tracker) {
      return;
    }

    const { missingAPs } = this._partialPosition(pool);
    clearTimeout(this._timeout);
    this._responsePools = {};

    if (missingAPs.length) {
      return this._tracker.partialData(pool);
    }

    const coords = trilateration.findCoordinates(this.beaconConfig, pool);

    return this._tracker.newPosition(coords, pool);
  }

  _partialPosition(pool) {
    const approximateConfig = config.aggregate.approximate;
    let missingAPs = this.apNames.reduce((missing, apName) => {
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

    return { missingAPs }
  }
}

module.exports = BeaconAggregator;
