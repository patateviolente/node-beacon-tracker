const expect = require('chai').expect;

const tracker = require('../../ts/tracker');

const config = require('../../config');

describe('tracker', () => {
  const restoreBoundsConfig = config.runawayBounds;
  before(() => {
    config.runawayBounds = [[[0, 0], [5, 5]]];
  });
  after(() => {
    config.runawayBounds = restoreBoundsConfig;
  });

  it('should ', async() => {
  });
});
