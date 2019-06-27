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

  poc(peripheral){
    const characteristicUuid = '000015251212efde1523785feabcd123';
    console.log('##############################')
    console.log(peripheral);

    peripheral.connect((err) => {
      console.log('connected');
      console.log(err);
      peripheral.discoverAllServicesAndCharacteristics((err, services) => {
        const characteristic = services.reduce((foundChar, service) => {
          return service.characteristics.find(({uuid}) => uuid === characteristicUuid) || foundChar;
        }, null);

        if(!characteristic){
          throw new Error(`cannot find characteristic ${characteristicUuid}`);
        }

        console.log('===>');
        console.log(characteristic);
        characteristic.write(Buffer.from('1'), true, () => {
          console.log('on')
        });
        setTimeout(() => {
          characteristic.write(Buffer.from('1'), true, () => {
            console.log('off');
            peripheral.disconnect();
          });
        }, 5000);
      });
    });
  }

  _prepareScan() {
    return noble.startScanningAsync([], true)
      .then(() => {
        noble.on('discover', (peripheral) => {
          if (!this._filter.length || this._filter.includes(peripheral.uuid)) {
            console.log('...');
            if(!once){
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

scanner = new BeaconScanner(['d2be738770db']);
scanner.startScan();
console.log('__________')
console.log(scanner);

