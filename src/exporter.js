const fs = require('fs');
const os = require('os');
const path = require('path');

const Promise = require('bluebird');

const logger = require('../lib/logger');

const config = require('../config');

fs.readFileAsync = Promise.promisify(fs.readFile);
fs.writeFileAsync = Promise.promisify(fs.writeFile);

class Exporter {
  constructor(mac, base = config.dashboard.base) {
    this.mac = mac;
    this.base = base;
    this.activeDate = null;
    this.activeData = [];
    this._hasUpdates = false;
    this._interval = null;
    this.liveLogsPath = path.join(os.tmpdir(), `${this.mac}.json`);
  }

  append(pool, coordinates) {
    return Promise.try(() => {
      if (!this.activeDate) {
        return this.loadCurrent();
      }

      if (nowYYYYMMDD() !== this.activeDate) {
        return this.saveCurrent()
          .then(() => this.loadCurrent());
      }
    })
      .then(() => {
        this._hasUpdates = true;
        this.activeData.push({ pool, coordinates });

        // Save into live logs
        return fs.writeFileAsync(this.liveLogsPath, JSON.stringify({ data: this.activeData }));
      });
  }

  loadCurrent() {
    return this.load()
      .then((activeData) => {
        this.activeDate = nowYYYYMMDD();
        this.activeData = activeData;
        this._interval = setInterval(() => this.saveCurrent(), config.dashboard.autosaveInterval);

        return this.activeData;
      })
  }

  async close() {
    if (this._hasUpdates) {
      await this.saveCurrent();
    }

    this._hasUpdates = false;
    clearInterval(this._interval);
  }

  saveCurrent() {
    const fileName = `${this.mac}-${this.activeDate}.json`;
    const filePath = path.join(this.base, fileName);
    const fileData = JSON.stringify({ data: this.activeData });
    logger.log(`Saving file ${filePath}`);

    return fs.writeFileAsync(filePath, fileData);
  }

  load(customYyyymmdd) {
    const yyyymmdd = nowYYYYMMDD() || customYyyymmdd;
    const fileName = `${this.mac}-${yyyymmdd}.json`;
    let filePath = path.join(this.base, fileName);

    // Live logs
    if (customYyyymmdd && yyyymmdd === nowYYYYMMDD()) {
      filePath = this.liveLogsPath;
    }

    return this.close()
      .then(() => fs.readFileAsync(filePath, 'utf8'))
      .then(rawData => JSON.parse(rawData))
      .then((json) => json.data || [])
      .catch(() => []);
  }
}

function nowYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

module.exports = Exporter;
