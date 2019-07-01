const Promise = require('bluebird');

class BluetoothPairing {
  constructor(peripheral) {
    this.peripheral = peripheral;
    this.peripheral.connectAsync = Promise.promisify(this.peripheral.connect);
    this.peripheral.discoverAllServicesAndCharacteristicsAsync = Promise.promisify(this.peripheral.discoverAllServicesAndCharacteristics);
    this.peripheral.disconnectAsync = Promise.promisify(this.peripheral.disconnect);
  }

  connect() {
    return this.peripheral.connectAsync();
  }

  disconnect() {
    return this.peripheral.disconnect();
  }

  findCharacteristics(filter) {
    return this.peripheral.discoverAllServicesAndCharacteristicsAsync()
      .then((characteristics) => {
        const filteredCharacteristic = characteristics.find((char) => {
          return Object.keys(filter).reduce((match, key) => {
            return match && char[key] === filter[key];
          }, true);
        });

        if (!filteredCharacteristic) {
          throw new Error(`Cannot find Characeristic with the filter ${JSON.stringify(filter)}`);
        }

        this.filteredCharacteristic = filteredCharacteristic;

        return filteredCharacteristic;
      });
  }
}

module.exports = BluetoothPairing;