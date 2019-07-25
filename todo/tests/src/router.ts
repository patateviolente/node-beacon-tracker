import * as rewire from 'rewire';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {expect} from 'chai';

import * as role from '../../../src/src/role';

const router = rewire('../../ts/router');

describe('router', () => {
  it('should return 404 for unknown routes', async () => {
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router({url: '/unknown'});
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should be unknown on a slave server', async () => {
    role.amIMaster = false;
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router({url: '/unknown'});
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should report position', async () => {
    role.amIMaster = true;
    const byMacStub = sinon.stub();
    const router = proxyquire('../../ts/router', {
      './aggregator': {byMAC: byMacStub}
    });
    await router({url: '/notify/pi2/11:22:33:aa:bb:cc/-60'});
    sinon.assert.calledOnce(byMacStub);
    expect(byMacStub.firstCall.args).to.eql(['11:22:33:aa:bb:cc']);
  });
});
