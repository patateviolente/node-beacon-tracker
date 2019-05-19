const Promise = require('bluebird');
const sinon = require('sinon');
const expect = require('chai').expect;

const trilateration = require('../lib/trilateration');
const aggregator = require('../src/aggregator');
const beaconMac = '001122334455';

describe('aggregator', () => {
  beforeEach(() => {
    aggregator._responsePools = {};
  });
  afterEach(() => sinon.restore());

  describe('slaveReport', () => {
    it('should not aggregate while there are not all AP responses', async() => {
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
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

    it('should aggregate when an AP responds back before others', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi1', beaconMac, -60);
      expect(aggregateStub.callCount).to.equal(1);
    });

    it('should aggregate after a 500ms timeout', async() => {
      const aggregateStub = sinon.stub(aggregator, 'aggregate');
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      await Promise.delay(520);
      expect(aggregateStub.callCount).to.equal(1);
    });
  });

  describe('aggregate', () => {
    afterEach(() => sinon.restore());

    it('should trilaterate, call back and purge response pool when all AP responded', () => {
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates')
        .returns({ x: 10, y: 5 });
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const positionFoundStub = sinon.fake();
      const incompleteDataStub = sinon.fake();
      aggregator.configure({
        positionFound: positionFoundStub,
        incompleteData: incompleteDataStub
      });
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.slaveReport('pi3', beaconMac, -60);
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(1);
      expect(positionFoundStub.callCount).to.equal(1);
      expect(incompleteDataStub.callCount).to.equal(0);
      expect(aggregator._responsePools[beaconMac]).to.eql({});
      expect(findCoordinateStub.firstCall.args[0]).to.have.keys(['pi1', 'pi2', 'pi3']);
      expect(findCoordinateStub.firstCall.args[0].pi1.rssi).to.equal(-50);
      expect(positionFoundStub.firstCall.args[0]).to.eql({ x: 10, y: 5 });
    });

    it('should call incompleteData callback where AP response are missing', () => {
      const findCoordinateStub = sinon.stub(trilateration, 'findCoordinates');
      const aggregateSpy = sinon.spy(aggregator, 'aggregate');
      const positionFoundStub = sinon.fake();
      const incompleteDataStub = sinon.fake();
      aggregator.configure({
        positionFound: positionFoundStub,
        incompleteData: incompleteDataStub
      });
      aggregator.slaveReport('pi1', beaconMac, -50);
      aggregator.slaveReport('pi2', beaconMac, -55);
      aggregator.aggregate(beaconMac);
      expect(aggregateSpy.callCount).to.equal(1);
      expect(findCoordinateStub.callCount).to.equal(0);
      expect(positionFoundStub.callCount).to.equal(0);
      expect(incompleteDataStub.callCount).to.equal(1);
      expect(aggregator._responsePools[beaconMac]).to.eql({});
    });
  });
});
