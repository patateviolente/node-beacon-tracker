const fs = require('fs');

const expect = require('chai').expect;

const Tracker = require('../../src/tracker');

const config = require('../../config');

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

  it('should log data when a partial position is found', async() => {
    const tracker = new Tracker(peripheral, {});
    await tracker.partialData({ pi1: 89 });
    await tracker.exporter.close();
    expect(fs.existsSync(todayLog)).to.be.true;
    fs.unlinkSync(todayLog);
  });
});
