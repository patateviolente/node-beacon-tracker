import {expect} from 'chai';

import {config} from '../../config';
import * as zones from '../../src/zones';

describe('zones', () => {
  it('should detect non allowed locations', () => {
    config.runawayBounds = [
      [[-20, -10], [-15, -5]]
    ];
    expect(zones.isAllowed(6, 10)).to.be.true;
    expect(zones.isAllowed(-10, -5)).to.be.true;
    expect(zones.isAllowed(-16, -8)).to.be.false;
  });

  it('should work on a multizone', () => {
    config.runawayBounds = [
      [[1, 1], [2, 2]],
      [[5, 1], [6, 2]]
    ];
    expect(zones.isAllowed(3, 1)).to.be.true;
    expect(zones.isAllowed(6, 1)).to.be.false;
  });
});
