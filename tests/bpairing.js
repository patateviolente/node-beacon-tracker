const Promise = require('bluebird');
const sinon = require('sinon');
const expect = require('chai').expect;

const trilateration = require('../lib/trilateration');
const utils = require('../lib/utils');
const tracker = require('../src/tracker');
const aggregator = require('../src/aggregator');
const config = require('../config');

const Bpairing = require('../lib/bpairing');

const peripheralMock = {
  connect: callback => callback(),
  discoverAllServicesAndCharacteristics: () => {},
  disconnect: () => {},
};

describe('aggregator', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should connect to the peripheral', async() => {
    const connectMock = sinon.stub(peripheralMock.connect());
    console.log(Bpairing);
    const bpairing = new Bpairing(peripheralMock);

    await bpairing.connect();
    expect(connectMock.callCount).to.equal(1);
  });
});