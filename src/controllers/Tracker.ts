import {EventEmitter} from 'events';

import * as Promise from 'bluebird';

import TrackerAlarm from './TrackerAlarm';
import Exporter from './Exporter';

import * as logger from '../lib/logger';
import RunawayBounds from '../lib/runawayBounds';
import {config} from '../config';

global.Promise = Promise;

export default class Tracker extends EventEmitter {
  private bounds: RunawayBounds;
  private alarm: TrackerAlarm;
  public exporter: Exporter;

  constructor(peripheral, beaconConfig) {
    super();
    this.bounds = new RunawayBounds(config.runawayBounds);
    this.exporter = new Exporter(peripheral.uuid);
    this.alarm = new TrackerAlarm(peripheral, beaconConfig);
  }

  partialData(pool) {
    logger.log(`partial position ${JSON.stringify(pool)}`, 2);

    return this.exporter.append({pool});
  }


  newPosition(coords, pool) {
    let logInfo = '';
    let distFromZone = this.bounds.distancefromZone(coords);
    if (distFromZone < 0 && !config.runawayCondition(pool)) {
      logInfo = 'imprecise';
      distFromZone = 0;
    }
    const isAllowed = distFromZone >= 0;

    return Promise.try(() => {
      if (isAllowed) {
        logger.log(`Position ok ${JSON.stringify(coords)}`);

        return this.alarm.stop();
      }

      // Update alert timing
      logger.log(`Forbidden position ${JSON.stringify(coords)}`);
      const alarmDuration = this.alarm.updateAlarmDuration(distFromZone);
      this.emit('alarm', alarmDuration);
      logInfo = `alarm ${alarmDuration}s}`;

      return this.alarm.play();
    })
      .then(() => this.exporter.append({pool, coords, distFromZone, logInfo}))
  }
}
