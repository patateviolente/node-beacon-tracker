import * as sinon from 'sinon';
import {expect} from 'chai';

import Bpairing from '../../lib/BluetoothPairing';

describe('aggregator', () => {
  let peripheralMock;

  afterEach(() => sinon.restore());

  beforeEach(() => {
    peripheralMock = {
      connect: callback => callback(),
      discoverServices: () => {},
      disconnect: callback => callback(),
    };
  });

  it('should connect /disconnect the peripheral', async () => {
    peripheralMock.state = 'connected';
    peripheralMock.connect = sinon.spy(peripheralMock.connect);
    peripheralMock.disconnect = sinon.spy(peripheralMock.disconnect);
    const bpairing = new Bpairing(peripheralMock);
    await bpairing.connect();
    expect(peripheralMock.connect.callCount).to.equal(1);

    await bpairing.disconnect();
    expect(peripheralMock.disconnect.callCount).to.equal(1);
  });
});
