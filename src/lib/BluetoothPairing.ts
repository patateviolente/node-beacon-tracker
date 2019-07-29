import * as Promise from 'bluebird';
import {Characteristic, Peripheral, Service} from "noble";

declare module 'noble' {
  export interface Peripheral {
    connectAsync(): Promise<any>

    discoverServicesAsync(serviceUUIDs: string[]): Promise<Service[]>

    disconnectAsync(): Promise<any>
  }

  export interface Service {
    discoverCharacteristicsAsync(characteristicUUIDs: string[]): Promise<Characteristic[]>
  }

  export interface Characteristic {
    writeAsync(data: Buffer, notify: boolean): Promise<void>
  }
}

export default class BluetoothPairing {
  private peripheral: Peripheral;
  private connected: boolean;

  constructor(peripheral: Peripheral) {
    this.connected = false;
    this.peripheral = peripheral;
    Promise.promisifyAll(this.peripheral);
  }

  connect(): Promise<this> {
    return this.peripheral.connectAsync()
      .return(this);
  }

  disconnect(): Promise<this> {
    if (this.peripheral.state === 'disconnected') {
      return Promise.resolve(this)
    }

    return this.peripheral.disconnectAsync()
      .return(this);
  }

  getService(serviceUUID: string): Promise<Service> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout during getService()'), 5000);

      return this.peripheral.discoverServicesAsync([serviceUUID])
        .then((services: Service[]) => {
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

  getCharacteristic(service: Service, characteristicUUID: string): Promise<Characteristic> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout during getService()'), 5000);

      return service.discoverCharacteristicsAsync([characteristicUUID])
        .then((characteristics: Characteristic[]) => {
          clearTimeout(timeout);
          if (characteristics.length !== 1) {
            return reject(new Error(`No service for UUID ${characteristicUUID}`));
          }

          // @ts-ignore
          characteristics[0].writeAsync = Promise.promisify(characteristics[0].write);

          return resolve(characteristics[0]);
        })
        .catch(reject);
    });
  }
}
