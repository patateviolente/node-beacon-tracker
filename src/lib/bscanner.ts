import * as Bluebird from 'bluebird';
import * as noble from 'noble';

const startScanningAsync = Bluebird.promisify(noble.startScanning);

export default class BeaconScanner {
  private filter: string[];
  private events: any;

  constructor(filter ?: string[]) {
    this.filter = filter;
    this.events = {
      signal: () => {}
    };
  }

  on(eventName: string, callback: Function) {
    this.events[eventName] = callback;
  }

  startScan() {
    // @ts-ignore
    return this.init()
      .then(() => this.prepareScan());
  }

  private init() {
    if (noble.state === 'poweredOn') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore
      noble.once('stateChange', (state) => {
        if (state !== 'poweredOn') {
          return reject(new Error(`Failed to initialize the Noble object: ${state}`));
        }

        return resolve();
      });
    });
  }

  private prepareScan() {
    // @ts-ignore
    return startScanningAsync([], true)
      .then(() => {
        noble.removeAllListeners('discover');
        noble.on('discover', (peripheral) => {
          if (!this.filter.length || this.filter.includes(peripheral.uuid)) {
            this.events['signal'](peripheral);
          }
        });
      });
  }
}
