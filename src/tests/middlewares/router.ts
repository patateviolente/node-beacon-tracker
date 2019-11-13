import * as rewire from 'rewire';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

import * as aggregator from '../../controllers/watch/Aggregator';

import * as role from '../../controllers/role';

const router = rewire('../../middlewares/router');

chai.use(sinonChai);

describe('router', () => {
  it('should return 404 for unknown routes', async () => {
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router.default({ url: '/unknown' });
    expect(notFoundSpy).to.be.calledOnce;
  });

  it('/notify/mac/rssi should be unknown on a slave server', async () => {
    // @ts-ignore
    role.role = 'slave';
    const notFoundSpy = sinon.spy(() => {
    });
    router.__set__('notFound', notFoundSpy);
    await router.default({ url: '/unknown' });
    expect(notFoundSpy).to.be.calledOnce;
  });

  it('/notify/mac/rssi should report position', async () => {
    // @ts-ignore
    role.role = 'master';
    const byMacStub = sinon.stub(aggregator.default, 'byMAC');
    await router.default({ url: '/notify/pi2/11:22:33:aa:bb:cc/-60' });
    expect(byMacStub).to.be.calledOnceWith('11:22:33:aa:bb:cc');
  });
});
