const utils = require('../lib/utils');
const logger = require('../lib/logger');
const trilateration = require('../lib/trilateration');

const Tracker = require('./tracker');

const config = require('../config');
const apNames = Object.keys(config.accessPoints);

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

    this.setStrategy(this.aggregateConfig.strategy);
  }

  static byMAC(mac){
    return aggregates[utils.standardizeMac(mac)];
  }

  static instantiateAll(){
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
        // TODO add event 'paired' / 'disconnected'
        // if (this._strategy === 'continuous') {
        //   logger.log(`inhibit aggregator continuous timer for ${alarmDuration} seconds`, logger.DEBUG);
        //   this._resetTimers();
        //   setTimeout(() => this.setStrategy('continuous'), alarmDuration);
        // }
      });

      this._tracker = tracker;
    }
  }

  setStrategy(strategy = 'continuous') {
    this._strategy = strategy;
    this._resetTimers();
    logger.log(`strategy set to ${strategy}`);

    if (this._strategy === 'continuous') {
      this._continuousInterval = setInterval(() => this.aggregate(), config.aggregate.interval);
    }
  }

  _resetTimers() {
    clearTimeout(this._timeout);
    clearInterval(this._continuousInterval);
  }

  slaveReport(apName, rssi) {
    clearTimeout(this._timeout);
    const pool = this._responsePools;

    // AP already responded
    if (this._strategy === 'when_available') {
      if (typeof pool[apName] !== 'undefined') {
        this.aggregate();
      }
      this._timeout = setTimeout(() => this.aggregate(), config.aggregate.timeout);
    }

    // Save the signal / update with best signal
    if (!pool[apName]) {
      pool[apName] = { rssi, date: new Date() };
    } else if (rssi > pool[apName].rssi) {
      pool[apName].rssi = rssi;
    }

    if (this._strategy === 'when_available' && apNames.length === Object.keys(pool).length) {
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

    const missingAPs = apNames.reduce((missing, apName) => {
      if (!pool[apName]) {
        missing.push(apName);
      }

      return missing;
    }, []);

    clearTimeout(this._timeout);
    this._responsePools = {};

    if (missingAPs.length) {
      return this._tracker.partialData(missingAPs, pool);
    }

    const coords = trilateration.findCoordinates(this.beaconConfig, pool);

    return this._tracker.newPosition(coords);
  }
}

module.exports = BeaconAggregator;
