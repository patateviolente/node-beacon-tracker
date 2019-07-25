import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as Bluebird from 'bluebird';

import * as logger from '../lib/logger';
import {config} from '../config';

const readFileAsync = Bluebird.promisify(fs.readFile);
const writeFileAsync = Bluebird.promisify(fs.writeFile);

type ExportRow = any;
type ExportData = ExportRow[];

export default class Exporter {
  private mac: string;
  private base: string;
  private activeDate: string;
  private activeData: ExportData;
  private hasUpdates: boolean;
  private interval: any;
  private liveLogsPath: string;

  constructor(mac, base = config.dashboard.base) {
    this.mac = mac;
    this.base = base;
    this.activeDate = null;
    this.activeData = [];
    this.hasUpdates = false;
    this.interval = null;
    this.liveLogsPath = path.join(os.tmpdir(), `${this.mac}.json`);
  }

  append(data: ExportRow): Bluebird<unknown> {
    return Bluebird.try(() => {
      if (!this.activeDate) {
        return this.loadCurrent();
      }

      if (nowYYYYMMDD() !== this.activeDate) {
        return this.saveCurrent()
          .then(() => this.loadCurrent());
      }
    })
      .then(() => {
        this.hasUpdates = true;
        this.activeData.push({date: new Date(), ...data});

        // Save into live logs
        // @ts-ignore
        return writeFileAsync(this.liveLogsPath, JSON.stringify({data: this.activeData}));
      });
  }

  loadCurrent(): Promise<ExportData> {
    return this.load()
      .then((activeData) => {
        this.activeDate = nowYYYYMMDD();
        this.activeData = activeData;
        this.interval = setInterval(() => this.saveCurrent(), config.dashboard.autosaveInterval);

        return this.activeData;
      })
  }

  async close(): Promise<void> {
    if (this.hasUpdates) {
      await this.saveCurrent();
    }

    this.hasUpdates = false;
    clearInterval(this.interval);
  }

  saveCurrent(): Promise<void> {
    const fileName = `${this.mac}-${this.activeDate}.json`;
    const filePath = path.join(this.base, fileName);
    const fileData = JSON.stringify({data: this.activeData});
    logger.log(`Saving file ${filePath}`);

    // @ts-ignore
    return writeFileAsync(filePath, fileData);
  }

  load(customYyyymmdd ?: string): Promise<ExportData> {
    const yyyymmdd: string = customYyyymmdd || nowYYYYMMDD();
    const fileName: string = `${this.mac}-${yyyymmdd}.json`;
    let filePath: string = path.join(this.base, fileName);

    // Live logs
    if (customYyyymmdd && customYyyymmdd === nowYYYYMMDD()) {
      filePath = this.liveLogsPath;
    }

    return this.close()
    // @ts-ignore
      .then(() => readFileAsync(filePath, 'utf8'))
      .then(rawData => JSON.parse(rawData))
      .then((json) => json.data || [])
      .catch(() => []);
  }
}

function nowYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}
