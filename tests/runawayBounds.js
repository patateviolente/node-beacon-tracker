const expect = require('chai').expect;

const RunawayBounds = require('../lib/runawayBounds');

describe('RunawayBounds lib', () => {
  it('should return boolean when inside / outside bounds', () => {
    //       |  XXX
    //       |
    // ------|------
    //       |
    // XXX   |
    const rb = new RunawayBounds([
      [[-10, -10], [-5, -5]],
      [[2, 2], [3, 4]]
    ]);

    expect(rb.positionAllowed({ x: 0, y: 0 })).to.be.true;
    expect(rb.positionAllowed({ x: -8, y: -8 })).to.be.false;
    expect(rb.positionAllowed({ x: 2.5, y: 3 })).to.be.false;
  });

  it('should work with Infinity / -Infinity', () => {
    // XXX|
    // ---|---
    //    |
    const rb = new RunawayBounds([
      [[-Infinity, 0], [0, Infinity]]
    ]);

    expect(rb.positionAllowed({ x: -1, y: -1 })).to.be.true;
    expect(rb.positionAllowed({ x: -1, y: 1 })).to.be.false;
    expect(rb.positionAllowed({ x: 1, y: -1 })).to.be.true;
    expect(rb.positionAllowed({ x: 1, y: 1 })).to.be.true;
  });
});
