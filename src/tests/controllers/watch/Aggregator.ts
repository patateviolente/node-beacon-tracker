import * as Promise from 'bluebird';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

import * as utils from '../../../utils/strings';

import { config } from '../../../config';
import * as trackerPackage from '../../../controllers/watch/Tracker';
import { EventEmitter } from 'events';
import Aggregator from '../../../controllers/watch/Aggregator';

const beaconMac = utils.standardizeMac('71:bc:23:4c:72:5b');

chai.use(sinonChai);

class StubbedTracker extends EventEmitter {
  newData() {}
}

describe('aggregator', () => {
  let aggregator;
  const accessPoints = {
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0.5,
      y: 8,
    },
    pi2: { x: 0, y: 0 },
    pi3: { x: 7.5, y: 9 },
  };

  before(() => {
    sinon.stub(config, 'accessPoints').value(accessPoints);
    Aggregator.instantiateAll();
    aggregator = Aggregator.byMAC(beaconMac);
  });

  beforeEach(() => {
    sinon.stub(config, 'accessPoints').value(accessPoints);
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

    it('should not aggregate without all AP responses', async () => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      expect(aggregateSpy).to.not.be.called;
    });

    it('should aggregate with all AP responses', async () => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -60);
      expect(aggregateStub).to.be.calledOnce;
    });

    it('should aggregate after the timeout', async () => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      config.aggregate.timeout = 10;
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      await Promise.delay(20);
      config.aggregate.timeout = 1000;
      expect(aggregateStub).to.be.calledOnce;
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
      expect(aggregateStub).to.not.be.called;
    });

    it('should aggregate every "interval" with best measures', async () => {
      aggregator.setStrategy('continuous');
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -60);
      expect(aggregateStub).to.not.be.called;

      await Promise.delay(80);
      expect(aggregateStub).to.not.be.called;

      // Improve result
      aggregator.slaveReport('pi1', -45);
      aggregator.slaveReport('pi1', -48);

      await Promise.delay(20);
      expect(aggregateStub).to.be.calledOnce;

      expect(aggregator.rssiPool.pi1).to.equal(-45);
      expect(aggregator.rssiPool.pi2).to.equal(-55);
      expect(aggregator.rssiPool.pi3).to.equal(-60);
    });
  });

  describe('aggregate', () => {
    afterEach(() => sinon.restore());
    beforeEach(() => aggregator.setStrategy('when_available'));

    it('should aggregate once all data in "when_available" and call newData', () => {
      config.aggregate.strategy = 'when_available';
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newDataStub = sinon.stub(aggregator.tracker, 'newData');
      aggregator.slaveReport('pi1', -50);
      aggregator.slaveReport('pi2', -55);
      aggregator.slaveReport('pi3', -60);
      expect(aggregateSpy).to.be.calledOnce;
      expect(newDataStub).to.be.calledOnce;
      expect(aggregator.rssiPool).to.eql({});
      expect(newDataStub.firstCall.args[0]).to.eql({
        pi1: -50,
        pi2: -55,
        pi3: -60,
      });
    });

    it('should call newData even with partial data', () => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newDataStub = sinon.stub(aggregator.tracker, 'newData');
      aggregator.slaveReport('pi1', -50);
      aggregator.aggregate();
      expect(aggregateSpy).to.be.calledOnce;
      expect(newDataStub).to.be.calledOnce;
      expect(newDataStub.firstCall.args[0]).to.eql({
        pi1: -50,
      });
    });
  });
});
