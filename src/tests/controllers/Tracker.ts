import * as fs from 'fs';

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as _ from 'lodash';

import * as stringUtils from '../../utils/strings';

import Tracker from '../../controllers/Tracker';

import { config } from '../../config';

describe('tracker', () => {
  const currentYYYYMMDD = stringUtils.dateToYYYYMMDD(new Date());
  const todayLog = `/tmp/aabbccddeeff-${currentYYYYMMDD}.json`;
  const peripheral = {
    uuid: 'aabbccddeeff',
    connect: () => {},
    discoverServices: () => {},
    disconnect: () => {},
  };
  let originalConfig;

  before(() => {
    if (fs.existsSync(todayLog)) fs.unlinkSync(todayLog);
    originalConfig = _.cloneDeep(config.tracker);
  });

  after(() => {
    config.tracker = originalConfig;
  });

  afterEach(() => {
    if (fs.existsSync(todayLog)) fs.unlinkSync(todayLog);
  });

  describe('newPosition - coordinates mode', () => {
    before(() => {
      config.tracker = {
        mode: 'coordinates',
        approximatePosition: pool => pool.pi2 > -95 && pool.pi3 > -95,
        runawayBounds: [[[0, 0], [5, 5]]]
      };
    });

    it('should log data when a partial position is found', async () => {
      const tracker = new Tracker(peripheral, {});
      await tracker.newData({ pi1: 89 });
      await tracker.exporter.close();
      expect(fs.existsSync(todayLog)).to.be.true;
    });

    // it('should do nothing when position is allowed', () => {
    //   const tracker = new Tracker(peripheral, {});
    //   tracker.newData()
    // });
  });
});
