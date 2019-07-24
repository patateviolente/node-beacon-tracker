import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import {expect} from 'chai';

import * as trilateration from '../../lib/trilateration';
import * as utils from '../../lib/utils';

import * as config from '../../config';

const Aggregator = proxyquire('../../ts/aggregator', {
  './tracker': function () {
    this.on = function () {
    }
  }
});

const beaconMac = utils.standardizeMac('71:bc:23:4c:72:5b');

describe('aggregator - approximate', () => {
  let aggregator;
  before(() => {
    Aggregator.instantiateAll();
    aggregator = Aggregator.byMAC(beaconMac);
  });

  beforeEach(() => {
    aggregator.addPeripheral(null);
    aggregator._responsePools = {};
  });
  afterEach(() => {
    sinon.restore();
    aggregator._resetTimers();
  });

  describe('slaveReport - "when_available" strategy', () => {
    beforeEach(() => aggregator.setStrategy('when_available'));


    it('should trilaterate, call back and purge response pool when all AP responded in "when_available" strategy', () => {
      config.aggregate.strategy = 'when_available';
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates')
        .returns({x: 10, y: 5});
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newPositionStub = sinon.stub(aggregator._tracker, 'newPosition');
      const partialDataStub = sinon.stub(aggregator._tracker, 'partialData');
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
