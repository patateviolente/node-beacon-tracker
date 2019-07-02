const rewire = require('rewire');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const expect = require('chai').expect;

const router = rewire('../../src/router');
const role = rewire('../../src/role');

describe('router', () => {
  it('should return 404 for unknown routes', async() => {
    const notFoundSpy = sinon.spy(() => {});
    router.__set__('notFound', notFoundSpy);
    await router({ url: '/unknown' });
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should be unknown on a slave server', async() => {
    role.amIMaster = false;
    const notFoundSpy = sinon.spy(() => {});
    router.__set__('notFound', notFoundSpy);
    await router({ url: '/unknown' });
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should report position', async() => {
    role.amIMaster = true;
    const slaveReportStub = sinon.stub();
    const router = proxyquire('../../src/router', {
      './aggregator': { slaveReport: slaveReportStub }
    });
    await router({ url: '/notify/pi2/11:22:33:aa:bb:cc/-60' });
    sinon.assert.calledOnce(slaveReportStub);
    expect(slaveReportStub.firstCall.args).to.eql(['pi2', '11:22:33:aa:bb:cc', -60]);
  });
});
