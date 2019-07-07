const expect = require('chai').expect;

const RunawayBounds = require('../../lib/runawayBounds');

describe('RunawayBounds lib', () => {
  it('should return boolean when inside / outside bounds', () => {
    //       |   XX
    // ------|------
    //       |
    const rb = new RunawayBounds([[[5, 2], [6, 3]]]);

    // In bounds
    expect(rb.inZone({ x: 5.5, y: 2.5 })).to.be.true;
    expect(rb.inZone({ x: 5, y: 2 })).to.be.true;
    expect(rb.inZone({ x: 6, y: 2 })).to.be.true;
    expect(rb.inZone({ x: 5, y: 3 })).to.be.true;
    expect(rb.inZone({ x: 6, y: 3 })).to.be.true;

    // Around
    expect(rb.inZone({ x: 4, y: 2 })).to.be.false;
    expect(rb.inZone({ x: 7, y: 2 })).to.be.false;
    expect(rb.inZone({ x: 5.5, y: 1 })).to.be.false;
    expect(rb.inZone({ x: 5.5, y: 4 })).to.be.false;
  });

  it('should return boolean when inside / outside bounds with any orientation', () => {
    // ------|------
    // X     |
    const rb1 = new RunawayBounds([[[-10, -5], [-9, -4]]]);
    const rb2 = new RunawayBounds([[[-9, -5], [-10, -4]]]);
    const rb3 = new RunawayBounds([[[-10, -4], [-9, -5]]]);
    const rb4 = new RunawayBounds([[[-9, -4], [-10, -5]]]);

    expect(rb1.inZone({ x: -9.5, y: -4.5 })).to.be.true;
    expect(rb2.inZone({ x: -9.5, y: -4.5 })).to.be.true;
    expect(rb3.inZone({ x: -9.5, y: -4.5 })).to.be.true;
    expect(rb4.inZone({ x: -9.5, y: -4.5 })).to.be.true;
  });

  it('should work with Infinity / -Infinity', () => {
    // XXX|
    // ---|---
    //    |
    const rb = new RunawayBounds([
      [[-Infinity, Infinity], [0, 0]]
    ]);

    expect(rb.inZone({ x: -1, y: -1 })).to.be.false;
    expect(rb.inZone({ x: -1, y: 1 })).to.be.true;
    expect(rb.inZone({ x: 1, y: -1 })).to.be.false;
    expect(rb.inZone({ x: 1, y: 1 })).to.be.false;

    const fullRb = new RunawayBounds([
      [[-Infinity, -Infinity], [Infinity, Infinity]]
    ]);

    expect(fullRb.inZone({ x: -999, y: -999 })).to.be.true;
    expect(fullRb.inZone({ x: -999, y: 999 })).to.be.true;
    expect(fullRb.inZone({ x: 999, y: -999 })).to.be.true;
    expect(fullRb.inZone({ x: 999, y: 999 })).to.be.true;
  });

  it('should return the nearest distance from a defined zones', () => {
    //  | - - - -
    //  | - X X -
    //  | - X X -
    //  | - - - -
    // ~|~~~~~~~~~
    const rb = new RunawayBounds([[[1, 1], [3, 3]]]);
    expect(rb.distancefromZone({ x: 1, y: 0 })).to.equal(1);
    expect(rb.distancefromZone({ x: 0, y: 1 })).to.equal(1);
    expect(rb.distancefromZone({ x: 2, y: -1 })).to.equal(2);
    expect(rb.distancefromZone({ x: -1, y: -1 })).to.equal(2.83);

    const rb2 = new RunawayBounds([[[1, 1], [Infinity, Infinity]]]);
    expect(rb2.distancefromZone({ x: 1, y: 0 })).to.equal(1);
    expect(rb2.distancefromZone({ x: 0, y: 1 })).to.equal(1);
    expect(rb2.distancefromZone({ x: 2, y: -1 })).to.equal(2);
    expect(rb2.distancefromZone({ x: -1, y: -1 })).to.equal(2.83);
  });

  it('should return finite value for an infinite zone', () => {
    const rb = new RunawayBounds([[[-Infinity, -Infinity], [Infinity, Infinity]]]);
    expect(rb.distancefromZone({ x: 0, y: 0 })).to.equal(-1000000);
  })
});
