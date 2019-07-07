const Bpairing = require('../lib/bpairing');

const maxBeepDuration = 5;
const minBeepDuration = 1;

class TrackerAlarm {
  constructor(peripheral) {
    this.peripheral = peripheral;
    this.pair = new Bpairing(this.peripheral);
    this.state = 'disconnected';
  }

  updateTiming(distance) {
    this._timing = {};
    this._timing.beepDuration = Math.max(Math.min(distance / 2, maxBeepDuration), minBeepDuration);

    return this._timing;
  }

  async play() {
    if (this.state.startsWith('connect')) return;
    this.state = 'connecting';

    await this.pair.connect();
    this.state = 'connected';
    this._alarmOn();
  }

  async pause() {
    if (this.state.startsWith('disconnect')) return;
    this.state = 'disconnecting';

    await this.pair.disconnect()
      .then(() => {
        const bluetoothListener = require('./bluetoothListener');
        console.log('___disconnected');

        return bluetoothListener.scan();
      });
    ;
    this.state = 'disconnected';
  }

  _alarmOn() {
    setTimeout(() => this._alarmOff(), this._timing.beepDuration * 1000);
  }

  _alarmOff() {
    return this.pause();
  }
}

module.exports = TrackerAlarm;
