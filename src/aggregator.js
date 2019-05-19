const utils = require('../lib/utils');
const trilateration = require('../lib/trilateration');

const config = require('../config');
const apNames = Object.keys(config.accessPoints);

class BeaconAggregator {
  constructor() {
    this._responsePools = {};
    this._timeouts = {};
    this.params = {
      positionFound: () => {},
      incompleteData: () => {}, // Some slave failed to retrieve signal
    }
  }

  configure(params) {
    Object.assign(this.params, params);
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
    this._timeouts[mac] = setTimeout(() => this.aggregate(mac), 500);
    pool[apName] = { rssi, date: new Date() };
    if (apNames.length === Object.keys(pool).length) {
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
      return this.params.incompleteData(missingAps, responses);
    }

    const coords = trilateration.findCoordinates(responses);
    return this.params.positionFound(coords);
  }
}

module.exports = new BeaconAggregator();
