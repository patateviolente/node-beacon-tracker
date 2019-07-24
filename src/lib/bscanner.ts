import * as Bluebird from 'bluebird';
import * as noble from 'noble';

const startScanningAsync = Promise.promisify(noble.startScanning);

export class BeaconScanner {
  private filter: [string];
  private _on: any;

  constructor(filter ?: [string]) {
    this.filter = filter;
    this.on = {
      signal: () => {}
    };
  }

  on(eventName: string, callback: Function) {
    this._on[eventName] = callback;
  }

  startScan() {
    return this.init()
      .then(() => this._prepareScan());
  }

  private init() {
    if (noble.state === 'poweredOn') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      noble.once('stateChange', (state) => {
        if (state !== 'poweredOn') {
          return reject(new Error(`Failed to initialize the Noble object: ${state}`));
        }

        return resolve();
      });
    });
  }

  _prepareScan() {
    // @ts-ignore
    return startScanningAsync([], true)
      .then(() => {
        noble.removeAllListeners('discover');
        noble.on('discover', (peripheral) => {
          if (!this.filter.length || this.filter.includes(peripheral.uuid)) {
            this.on['signal'](peripheral);
          }
        });
      });
  }
}
