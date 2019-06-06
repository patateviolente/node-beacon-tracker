const Promise = require('bluebird');
const sinon = require('sinon');
const expect = require('chai').expect;

const trilateration = require('../lib/trilateration');
const utils = require('../lib/utils');
const tracker = require('../src/tracker');
const aggregator = require('../src/aggregator');
const config = require('../config');

const beaconMac = utils.standardizeMac('71bc23:4c:72:5b');

describe('aggregator', () => {
  beforeEach(() => {
    aggregator._responsePools = {};
  });
  afterEach(() => sinon.restore());

  describe('slaveReport - "when_available" strategy', () => {
    beforeEach(() => aggregator.setStrategy('when_available'));

    it('should not aggregate without all AP responses', async() => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      config.aggregate.strategy = 'continuous';
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      expect(aggregateSpy.callCount).to.equal(0);
    });

    it('should aggregate with all AP responses', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
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

  describe('slaveReport - "continuous" strategy', () => {
    beforeEach(() => {
      config.aggregate.interval = 100;
      aggregator.setStrategy('continuous');
    });

    it('should not aggregate even with all AP responses in "continuous" strategy', async() => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -52);
      expect(aggregateSpy.callCount).to.equal(0);
    });

    it('should aggregate every "interval" with best measures', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
      expect(aggregateStub.callCount).to.equal(0);

      await Promise.delay(80);
      expect(aggregateStub.callCount).to.equal(0);

      // Improve result
      aggregator.slaveReport('pi1', beaconMac, -45);
      aggregator.slaveReport('pi1', beaconMac, -48);

      await Promise.delay(20);
      expect(aggregateStub.callCount).to.equal(1);

      expect(aggregator._responsePools[beaconMac].pi1.rssi).to.equal(-45);
      expect(aggregator._responsePools[beaconMac].pi2.rssi).to.equal(-55);
      expect(aggregator._responsePools[beaconMac].pi3.rssi).to.equal(-60);
    });
  });

  describe('aggregate', () => {
    afterEach(() => sinon.restore());
    beforeEach(() => aggregator.setStrategy('when_available'));

    it('should trilaterate, call back and purge response pool when all AP responded in "when_available" strategy', () => {
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
      expect(findCoordinateStub.firstCall.args[0]).to.have.keys(['mac', 'oneMeterToBeaconRssi']);
      expect(findCoordinateStub.firstCall.args[1]).to.have.keys(['pi1', 'pi2', 'pi3']);
      expect(findCoordinateStub.firstCall.args[1].pi1.rssi).to.equal(-50);
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
