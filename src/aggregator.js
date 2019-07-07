const utils = require('../lib/utils');
const logger = require('../lib/logger');
const trilateration = require('../lib/trilateration');

const Tracker = require('./tracker');

const config = require('../config');
const apNames = Object.keys(config.accessPoints);

class BeaconAggregator {
  constructor() {
    this._responsePools = {};
    this._timeouts = {};
    this._continuousInterval = null;
    this._strategy = config.aggregate.strategy;
    this._trackers = {};
  }

  addPeripheral(mac, peripheral) {
    if (!this._trackers[mac]) {
      const tracker = new Tracker(peripheral);

      // When alarm is ringing, devices is paired and no position can be emitted
      tracker.on('alarm', (alarmDuration) => {
        if (this._strategy === 'continuous') {
          logger.log(`inhibit aggregator continuous timer for ${alarmDuration} seconds`, logger.DEBUG);
          this._resetTimers();
          setTimeout(() => setStrategy('continuous'), alarmDuration);
        }
      });

      this._trackers[mac] = tracker;
    }
  }

  setStrategy(strategy = 'continuous') {
    this._strategy = strategy;
    this._resetTimers();

    if (this._strategy === 'continuous') {
      this._continuousInterval = setInterval(() => {
        Object.keys(this._responsePools).forEach((mac) => this.aggregate(mac));
      }, config.aggregate.interval);
    }
  }

  _resetTimers() {
    Object.values(this._timeouts).map(clearTimeout);
    clearInterval(this._continuousInterval);
  }

  slaveReport(apName, mac, rssi) {
    utils.standardizeMac(mac);
    clearTimeout(this._timeouts[mac]);
    if (!this._responsePools[mac]) {
      this._responsePools[mac] = {};
    }
    const pool = this._responsePools[mac];

    // AP already responded
    if (this._strategy === 'when_available') {
      if (typeof pool[apName] !== 'undefined') {
        this.aggregate(mac);
      }
      this._timeouts[mac] = setTimeout(() => this.aggregate(mac), config.aggregate.timeout);
    }

    // Save the signal / update with best signal
    if (!pool[apName]) {
      pool[apName] = { rssi, date: new Date() };
    } else if (rssi > pool[apName].rssi) {
      pool[apName].rssi = rssi;
    }

    if (this._strategy === 'when_available' && apNames.length === Object.keys(pool).length) {
      this.aggregate(mac);
    }
  }

  aggregate(mac) {
    const responses = this._responsePools[mac];
    const hasResponses = Object.keys(responses);
    if (!hasResponses) {
      return;
    }

    const missingAPs = apNames.reduce((missing, apName) => {
      if (!responses[apName]) {
        missing.push(apName);
      }

      return missing;
    }, []);

    clearTimeout(this._timeouts[mac]);
    this._responsePools[mac] = {};

    if (missingAPs.length) {
      return this._trackers[mac].partialData(missingAPs, responses);
    }

    const beaconConfig = Object.values(config.beacons).find(beacon => beacon.mac === mac);
    const coords = trilateration.findCoordinates(beaconConfig, responses);

    return this._trackers[mac].newPosition(coords);
  }
}

module.exports = new BeaconAggregator();
