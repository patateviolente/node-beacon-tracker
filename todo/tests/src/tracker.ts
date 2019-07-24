import * as fs from 'fs';

import {expect} from 'chai';

import * as Tracker from '../../ts/tracker';

import {config} from '../../../src/config';

describe('tracker', () => {
  const currentYYYYMMDD = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todayLog = `/tmp/aabbccddeeff-${currentYYYYMMDD}.json`;
  const restoreBoundsConfig = config.runawayBounds;
  const peripheral = {
    uuid: 'aabbccddeeff',
    connect: () => {},
    discoverServices: () => {},
    disconnect: () => {},
  };
  before(() => {
    if (fs.existsSync(todayLog)) fs.unlinkSync(todayLog);
    config.runawayBounds = [[[0, 0], [5, 5]]];
  });
  after(() => {
    config.runawayBounds = restoreBoundsConfig;
  });

  it('should log data when a partial position is found', async () => {
    const tracker = new Tracker(peripheral, {});
    await tracker.partialData({pi1: 89});
    await tracker.exporter.close();
    expect(fs.existsSync(todayLog)).to.be.true;
    fs.unlinkSync(todayLog);
  });
});
