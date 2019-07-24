import * as Promise from 'bluebird';
import * as noble from 'noble';

global.Promise = Promise;

export class BeaconScanner {
  constructor(filter = []) {
    this._filter = filter;
    this.onSignal = () => {
    };
    this._is_scanning = false;
    noble.startScanningAsync = Promise.promisify(noble.startScanning);
  }

  startScan() {
    return this._init()
      .then(() => this._prepareScan());
  }

  _init() {
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
    return noble.startScanningAsync([], true)
      .then(() => {
        noble.removeAllListeners('discover');
        noble.on('discover', (peripheral) => {
          if (!this._filter.length || this._filter.includes(peripheral.uuid)) {
            this.onSignal(peripheral);
          }
        });
        this._is_scanning = true;
      });
  }
}
