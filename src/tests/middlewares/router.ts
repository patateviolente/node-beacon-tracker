import * as rewire from 'rewire';
import * as sinon from 'sinon';
import { expect } from 'chai';

import * as aggregator from '../../controllers/Aggregator';

import * as role from '../../controllers/role';

const router = rewire('../../middlewares/router');

describe('router', () => {
  it('should return 404 for unknown routes', async () => {
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router.default({ url: '/unknown' });
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should be unknown on a slave server', async () => {
    // @ts-ignore
    role.role = 'slave';
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router.default({ url: '/unknown' });
    sinon.assert.calledOnce(notFoundSpy);
  });

  it('/notify/mac/rssi should report position', async () => {
    // @ts-ignore
    role.role = 'master';
    const byMacStub = sinon.stub(aggregator.default, 'byMAC');
    await router.default({ url: '/notify/pi2/11:22:33:aa:bb:cc/-60' });
    sinon.assert.calledOnce(byMacStub);
    expect(byMacStub.firstCall.args).to.eql(['11:22:33:aa:bb:cc']);
  });
});
