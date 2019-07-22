const fs = require('fs');
const path = require('path');

const Promise = require('bluebird');

const config = require('../config');

fs.readFileAsync = Promise.promisify(fs.readFile);
fs.writeFileAsync = Promise.promisify(fs.writeFile);

class Exporter {
  constructor(mac, base = config.dashboard.storage) {
    this.mac = mac;
    this.base = base;
    this.activeDate = null;
    this.activeData = [];
  }

  loadCurrent() {
    return this.load()
      .then((activeData) => {
        this.activeDate = nowYYYYMMDD();
        this.activeData = activeData;

        return this.activeData;
      })
  }

  saveCurrent() {
    const fileName = `${this.mac}-${this.activeDate}.json`;
    const filePath = path.join(this.base, fileName);
    const fileData = JSON.stringify({ data: this.activeData });

    return fs.writeFileAsync(filePath, fileData);
  }

  load(customYyyymmdd) {
    const yyyymmdd = nowYYYYMMDD() || customYyyymmdd;
    const fileName = `${this.mac}-${yyyymmdd}.json`;
    const filePath = path.join(this.base, fileName);

    return fs.readFileAsync(filePath, 'utf8')
      .then(rawData => JSON.parse(rawData))
      .then((json) => json.data || [])
      .catch(() => []);
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
      .then(() => this.activeData.push({ pool, coordinates }));
  }
}

function nowYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

module.exports = Exporter;
