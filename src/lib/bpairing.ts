import * as Promise from 'bluebird';

global.Promise = Promise;

export default class BluetoothPairing {
  private peripheral: any;
  private connected: boolean;

  constructor(peripheral) {
    this.connected = false;
    this.peripheral = peripheral;
    this.peripheral.connectAsync = Promise.promisify(this.peripheral.connect);
    this.peripheral.discoverServicesAsync = Promise.promisify(this.peripheral.discoverServices);
    this.peripheral.disconnectAsync = Promise.promisify(this.peripheral.disconnect);
  }

  connect() {
    return this.peripheral.connectAsync()
      .return(this);
  }

  disconnect() {
    if (this.peripheral.state === 'disconnected') {
      return Promise.resolve()
    }

    return this.peripheral.disconnectAsync()
      .return(this);
  }

  getService(serviceUUID) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout during getService()'), 5000);

      return this.peripheral.discoverServicesAsync(serviceUUID)
        .then((services) => {
          clearTimeout(timeout);
          if (services.length !== 1) {
            return reject(new Error(`No service for UUID ${serviceUUID}`));
          }

          services[0].discoverCharacteristicsAsync = Promise.promisify(services[0].discoverCharacteristics);

          return resolve(services[0]);
        })
        .catch(reject);
    });
  }

  getCharacteristic(service, characteristicUUID) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout during getService()'), 5000);

      return service.discoverCharacteristicsAsync(characteristicUUID)
        .then((characteristics) => {
          clearTimeout(timeout);
          if (characteristics.length !== 1) {
            return reject(new Error(`No service for UUID ${characteristicUUID}`));
          }

          characteristics[0].writeAsync = Promise.promisify(characteristics[0].write);

          return resolve(characteristics[0]);
        })
        .catch(reject);
    });
  }
}
