import * as sinon from 'sinon';
import * as chai from 'chai';
import { expect } from 'chai';

import * as sinonChai from 'sinon-chai';

import BluetoothPairing from '../../../lib/bluetooth/BluetoothPairing';

chai.use(sinonChai);

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
    const bpairing = new BluetoothPairing(peripheralMock);
    await bpairing.connect();
    expect(peripheralMock.connect).to.be.calledOnce;

    await bpairing.disconnect();
    expect(peripheralMock.disconnect).to.be.calledOnce;
  });
});
