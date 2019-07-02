const TrackerAlarm = require('./trackerAlarm');

const logger = require('../lib/logger');
const RunawayBounds = require('../lib/runawayBounds');
const config = require('../config');

class Tracker {
  constructor(peripheral) {
    this.bounds = new RunawayBounds(config.runawayBounds);
    this._alarm = new TrackerAlarm(peripheral);
  }

  partialData(missingAps, responses) {
    logger.log(`partial position ${JSON.stringify(responses)}`, 2);
  }

  newPosition(coords) {
    const distFromZone = this.bounds.distancefromZone(coords);
    const isAllowed = distFromZone > 0;

    if (isAllowed) {
      logger.log(`Position ok ${JSON.stringify(coords)}`);
      return this._alarm.pause();
    }

    // Update alert timing
    logger.log(`Forbidden position ${JSON.stringify(coords)}`);
    this._alarm.updateTiming(distFromZone);
    return this._alarm.play();
  }
}

module.exports = Tracker;
