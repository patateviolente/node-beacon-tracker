import {EventEmitter} from 'events';

import * as sinon from 'sinon';
import {expect} from 'chai';

import * as trilateration from '../../lib/trilateration';
import * as stringUtils from '../../utils/strings';

import Aggregator from '../../controllers/Aggregator';
import * as trackerPackage from '../../controllers/Tracker';

import {config} from '../../config';

const beaconMac = stringUtils.standardizeMac('71:bc:23:4c:72:5b');

class StubbedTracker extends EventEmitter {
  public newPosition() {}

  public partialData() {}
}

describe('aggregator - approximate', () => {
  let aggregator;
  before(() => {
    Aggregator.instantiateAll();
    aggregator = Aggregator.byMAC(beaconMac);
  });

  beforeEach(() => {
    sinon.stub(trackerPackage, 'default')
      .callsFake(() => new StubbedTracker());
    aggregator.addPeripheral(null);
    aggregator.rssiPool = {};
  });
  afterEach(() => {
    sinon.restore();
    aggregator.resetTimers();
  });

  describe('slaveReport - "when_available" strategy', () => {
    beforeEach(() => aggregator.setStrategy('when_available'));


    it('should trilaterate, call back and purge response pool when all AP responded in "when_available" strategy', () => {
      config.aggregate.strategy = 'when_available';
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates')
        .returns({x: 10, y: 5});
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newPositionStub = sinon.stub(aggregator.tracker, 'newPosition');
      const partialDataStub = sinon.stub(aggregator.tracker, 'partialData');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.aggregate();
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(1);
      expect(newPositionStub.callCount).to.equal(1);
      expect(partialDataStub.callCount).to.equal(0);
    });
  });
});
