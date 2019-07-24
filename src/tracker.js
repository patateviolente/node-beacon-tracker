const events = require('events');

const Promise = require('bluebird');

const TrackerAlarm = require('./trackerAlarm');
const Exporter = require('./exporter');

const logger = require('../lib/logger');
const RunawayBounds = require('../lib/runawayBounds');
const config = require('../config');

class Tracker {
  constructor(peripheral, beaconConfig) {
    this.bounds = new RunawayBounds(config.runawayBounds);
    this.exporter = new Exporter(peripheral.uuid);
    this._alarm = new TrackerAlarm(peripheral, beaconConfig);
    this._eventEmitter = new events.EventEmitter();
  }

  on(eventName, callback) {
    this._eventEmitter.on(eventName, callback);
  }

  partialData(pool) {
    logger.log(`partial position ${JSON.stringify(pool)}`, 2);

    return this.exporter.append({ pool });
  }

  newPosition(coords, pool) {
    let distFromZone = this.bounds.distancefromZone(coords);
    if (distFromZone < 0 && !config.runawayCondition(pool)) {
      distFromZone = 0;
    }
    const isAllowed = distFromZone >= 0;

    return Promise.try(() => {
      if (isAllowed) {
        logger.log(`Position ok ${JSON.stringify(coords)}`);

        return this._alarm.stop();
      }

      // Update alert timing
      logger.log(`Forbidden position ${JSON.stringify(coords)}`);
      const timing = this._alarm.updateTiming(distFromZone);
      this._eventEmitter.emit('alarm', timing.beepDuration);

      return this._alarm.play();
    })
      .then(() => this.exporter.append({ pool, coords, distFromZone }))
  }
}

module.exports = Tracker;
