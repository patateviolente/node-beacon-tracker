import * as fs from 'fs';
import * as os from 'os';

import * as Promise from 'bluebird';
import {expect} from 'chai';

import Exporter from '../../controllers/Exporter';

import {config} from '../../config';

describe('exporter', () => {
  const tmpdir = os.tmpdir();
  const currentYYYYMMDD = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todayLog = `${tmpdir}/aabbccddeeff-${currentYYYYMMDD}.json`;
  const liveLog = `${tmpdir}/aabbccddeeff.json`;
  let exporter = null;

  before(() => {
    config.dashboard.base = '/tmp/';
    config.dashboard.autosaveInterval = 90;
  });
  afterEach(async () => {
    await exporter.close();
    if (fs.existsSync(todayLog)) fs.unlinkSync(todayLog);
    if (fs.existsSync(liveLog)) fs.unlinkSync(liveLog);
  });
  after(() => {
    config.dashboard.autosaveInterval = 300 * 1000;
  });

  it('should create and append to today log in live logs and in resident logs', async () => {
    exporter = new Exporter('aabbccddeeff', tmpdir);
    await exporter.append({
      pool: {pi1: -62, pi2: -62, pi3: -78},
      coords: {x: 5, y: 2},
      distFromZone: 4
    });

    expect(fs.existsSync(todayLog)).to.equal(false);
    expect(fs.existsSync(`${tmpdir}/aabbccddeeff.json`)).to.equal(true);
    await exporter.saveCurrent();

    expect(fs.existsSync(todayLog)).to.be.true;
    expect(fs.readFileSync(todayLog, 'utf8')).to.have.string('"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coords":{"x":5,"y":2},"distFromZone":4}]}');
  });

  it('should append to today log', async () => {
    fs.writeFileSync(todayLog, '{"data":[{"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coords":{"x":5,"y":2}}]}');
    expect(fs.readFileSync(todayLog, 'utf8')).to.have.string('"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coords":{"x":5,"y":2}');

    exporter = new Exporter('aabbccddeeff', tmpdir);
    await exporter.append({pool: {pi1: -90}});
    await exporter.saveCurrent();

    expect(fs.existsSync(todayLog)).to.be.true;
    expect(fs.readFileSync(todayLog, 'utf8')).to.have.string('"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coords":{"x":5,"y":2}');
  });

  it('should autosave today current logs', async () => {
    exporter = new Exporter('aabbccddeeff', tmpdir);
    await exporter.append({pool: {pi1: -62}});

    expect(fs.existsSync(todayLog)).to.be.false;
    await Promise.delay(200);
    expect(fs.existsSync(todayLog)).to.be.true;
  });
});
