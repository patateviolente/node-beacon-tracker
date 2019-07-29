import * as Promise from 'bluebird';
import * as noble from 'noble';

const startScanningAsync = Promise.promisify(noble.startScanning);

export default class BeaconScanner {
  private filter: string[];
  private events: { [eventName: string]: Function };

  constructor(filter ?: string[]) {
    this.filter = filter;
    this.events = {
      signal: () => {}
    };
  }

  on(eventName: string, callback: Function): this {
    this.events[eventName] = callback;

    return this;
  }

  startScan() {
    // @ts-ignore
    return this.init()
      .then(() => this.prepareScan());
  }

  private init(): Promise<void> {
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

  private prepareScan(): Promise<void> {
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
