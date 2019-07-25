import * as Promise from 'bluebird';
import * as sinon from 'sinon';
import {expect} from 'chai';

import * as trilateration from '../../lib/trilateration';
import * as utils from '../../lib/utils';

import {config} from '../../config';
import * as trackerPackage from "../../controllers/Tracker";
import {EventEmitter} from "events";
import Aggregator from '../../controllers/Aggregator';

const beaconMac = utils.standardizeMac('71:bc:23:4c:72:5b');

class StubbedTracker extends EventEmitter {
  public newPosition() {}

  public partialData() {}
}

describe('aggregator', () => {
  let aggregator;
  before(() => {
    Aggregator.instantiateAll();
    aggregator = Aggregator.byMAC(beaconMac);
  });

  beforeEach(() => {
    sinon.stub(trackerPackage, 'default')
      .callsFake(() => new StubbedTracker());
    aggregator.addPeripheral(null);
    aggregator.responsePools = {};
  });
  afterEach(() => {
    sinon.restore();
    aggregator.resetTimers();
  });

  describe('slaveReport - "when_available" strategy', () => {
    beforeEach(() => aggregator.setStrategy('when_available'));

    it('should not aggregate without all AP responses', async () => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      expect(aggregateSpy.callCount).to.equal(0);
    });

    it('should aggregate with all AP responses', async () => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -60);
      expect(aggregateStub.callCount).to.equal(1);
    });

    it('should aggregate after the timeout', async () => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      config.aggregate.timeout = 10;
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      await Promise.delay(20);
      config.aggregate.timeout = 1000;
      expect(aggregateStub.callCount).to.equal(1);
    });
  });

  describe('slaveReport - "continuous" strategy', () => {
    beforeEach(() => {
      config.aggregate.interval = 100;
    });

    it('should not aggregate even with all AP responses', async () => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.setStrategy('continuous');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -52);
      expect(aggregateStub.callCount).to.equal(0);
    });

    it('should aggregate every "interval" with best measures', async () => {
      aggregator.setStrategy('continuous');
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -60);
      expect(aggregateStub.callCount).to.equal(0);

      await Promise.delay(80);
      expect(aggregateStub.callCount).to.equal(0);

      // Improve result
      aggregator.slaveReport('pi1', -45);
      aggregator.slaveReport('pi1', -48);

      await Promise.delay(20);
      expect(aggregateStub.callCount).to.equal(1);

      expect(aggregator.responsePools.pi1).to.equal(-45);
      expect(aggregator.responsePools.pi2).to.equal(-55);
      expect(aggregator.responsePools.pi3).to.equal(-60);
    });
  });

  describe('aggregate', () => {
    afterEach(() => sinon.restore());
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
      aggregator.slaveReport('pi3', -60);
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(1);
      expect(newPositionStub.callCount).to.equal(1);
      expect(partialDataStub.callCount).to.equal(0);
      expect(aggregator.responsePools).to.eql({});
      expect(findCoordinateStub.firstCall.args[0]).to.include.keys(['mac', 'reference']);
      expect(findCoordinateStub.firstCall.args[1]).to.have.keys(['pi1', 'pi2', 'pi3']);
      expect(findCoordinateStub.firstCall.args[1].pi1).to.equal(-50);
      expect(newPositionStub.firstCall.args[0]).to.eql({x: 10, y: 5});
    });

    it('should call incompleteData callback where AP response are missing', () => {
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates');
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newPositionStub = sinon.stub(aggregator.tracker, 'newPosition');
      const partialDataStub = sinon.stub(aggregator.tracker, 'partialData');
      aggregator.slaveReport('pi1', -50);
      aggregator.aggregate();
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(0);
      expect(newPositionStub.callCount).to.equal(0);
      expect(partialDataStub.callCount).to.equal(1);
      expect(aggregator.responsePools).to.eql({});
    });
  });
});
