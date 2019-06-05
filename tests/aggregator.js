const Promise = require('bluebird');
const sinon = require('sinon');
const expect = require('chai').expect;

const trilateration = require('../lib/trilateration');
const tracker = require('../src/tracker');
const aggregator = require('../src/aggregator');
const config = require('../config');
const beaconMac = '001122334455';

describe('aggregator', () => {
  beforeEach(() => {
    aggregator._responsePools = {};
  });
  afterEach(() => sinon.restore());

  describe('slaveReport', () => {
    it('should not aggregate while there are not all AP responses in "continuous" strategy', async() => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      config.aggregate.strategy = 'continuous';
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      expect(aggregateSpy.callCount).to.equal(0);
    });

    it('should aggregate with all AP responses in "when_available" strategy', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      config.aggregate.strategy = 'when_available';
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
      expect(aggregateStub.callCount).to.equal(1);
    });

    it('should aggregate in "continuous" every "interval" with best measures', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      config.aggregate.strategy = 'continuous';
      config.aggregate.interval = 10;
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
      expect(aggregateStub.callCount).to.equal(0);

      await Promise.delay(20);
      aggregator.slaveReport('pi1', beaconMac, -45);
      expect(aggregateStub.callCount).to.equal(1);
      expect(aggregator._responsePools[beaconMac].pi1.rssi).to.equal(-45);
      aggregator.slaveReport('pi1', beaconMac, -48);
      expect(aggregator._responsePools[beaconMac].pi1.rssi).to.equal(-45);
    });

    it('should aggregate when an AP responds back before others', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi1', beaconMac, -60);
      expect(aggregateStub.callCount).to.equal(1);
    });

    it('should aggregate after the timeout', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      config.aggregate.timeout = 10;
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      await Promise.delay(20);
      config.aggregate.timeout = 1000;
      expect(aggregateStub.callCount).to.equal(1);
    });
  });

  describe('aggregate', () => {
    afterEach(() => sinon.restore());

    it('should trilaterate, call back and purge response pool when all AP responded', () => {
      config.aggregate.strategy = 'when_available';
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates')
        .returns({ x: 10, y: 5 });
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newPositionStub = sinon.stub(tracker, 'newPosition');
      const partialDataStub = sinon.stub(tracker, 'partialData');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(1);
      expect(newPositionStub.callCount).to.equal(1);
      expect(partialDataStub.callCount).to.equal(0);
      expect(aggregator._responsePools[beaconMac]).to.eql({});
      expect(findCoordinateStub.firstCall.args[0]).to.have.keys(['pi1', 'pi2', 'pi3']);
      expect(findCoordinateStub.firstCall.args[0].pi1.rssi).to.equal(-50);
      expect(newPositionStub.firstCall.args[0]).to.eql({ x: 10, y: 5 });
    });

    it('should call incompleteData callback where AP response are missing', () => {
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates');
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const newPositionStub = sinon.stub(tracker, 'newPosition');
      const partialDataStub = sinon.stub(tracker, 'partialData');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.aggregate(beaconMac);
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(0);
      expect(newPositionStub.callCount).to.equal(0);
      expect(partialDataStub.callCount).to.equal(1);
      expect(aggregator._responsePools[beaconMac]).to.eql({});
    });
  });
});
