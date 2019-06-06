const utils = require('../lib/utils');
const trilateration = require('../lib/trilateration');
const tracker = require('./tracker');

const config = require('../config');
const apNames = Object.keys(config.accessPoints);

class BeaconAggregator {
  constructor() {
    this._responsePools = {};
    this._timeouts = {};
    this._continuousInterval = null;
    this._strategy = config.aggregate.strategy;
  }

  setStrategy(strategy = 'continuous') {
    this._strategy = strategy;
    Object.values(this._timeouts).map(clearTimeout);
    clearInterval(this._continuousInterval);

    if (this._strategy === 'continuous') {
      this._continuousInterval = setInterval(() => {
        Object.keys(this._responsePools).forEach((mac) => this.aggregate(mac));
      }, config.aggregate.interval);
    }
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
      return tracker.partialData(missingAPs, responses);
    }

    const beaconConfig = Object.values(config.beacons).find(beacon => beacon.mac === mac);
    const coords = trilateration.findCoordinates(beaconConfig, responses);
    return tracker.newPosition(coords);
  }
}

module.exports = new BeaconAggregator();
