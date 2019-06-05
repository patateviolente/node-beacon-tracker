const utils = require('../lib/utils');
const trilateration = require('../lib/trilateration');
const tracker = require('./tracker');

const config = require('../config');
const apNames = Object.keys(config.accessPoints);

class BeaconAggregator {
  constructor() {
    this._responsePools = {};
    this._timeouts = {};
  }

  slaveReport(apName, mac, rssi) {
    utils.standardizeMac(mac);
    clearTimeout(this._timeouts[mac]);
    if (!this._responsePools[mac]) {
      this._responsePools[mac] = {};
    }
    const pool = this._responsePools[mac];

    // AP already responded
    if (typeof pool[apName] !== 'undefined') {
      this.aggregate(mac);
    }
    this._timeouts[mac] = setTimeout(() => this.aggregate(mac), config.aggregate.timeout);

    // Save the signal / update with best signal
    if (!pool[apName]) {
      pool[apName] = { rssi, date: new Date() };
    } else if (rssi > pool[apName].rssi) {
      pool[apName].rssi = rssi;
    }

    if (apNames.length === Object.keys(pool).length && config.aggregate.strategy === 'when_available') {
      this.aggregate(mac);
    }
  }

  aggregate(mac) {
    const responses = this._responsePools[mac];
    const missingAps = apNames.reduce((missing, apName) => {
      if (!responses[apName]) {
        missing.push(apName);
      }

      return missing;
    }, []);

    clearTimeout(this._timeouts[mac]);
    this._responsePools[mac] = {};

    if (missingAps.length) {
      return tracker.partialData(missingAps, responses);
    }

    const coords = trilateration.findCoordinates(responses);
    return tracker.newPosition(coords);
  }
}

module.exports = new BeaconAggregator();
