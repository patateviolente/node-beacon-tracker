const Promise = require('bluebird');

const config = require('../config');

const logger = require('../lib/logger');

class Tracker {
  constructor() {

  }

  newPosition(coords) {
    logger.log(`position found ${JSON.stringify(coords)}`);
  }

  partialData(missingAps, responses) {
    logger.log(`partial position ${JSON.stringify(responses)}`, 2);
  }
}

module.exports = new Tracker();
