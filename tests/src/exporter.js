const fs = require('fs');
const os = require('os');

const expect = require('chai').expect;

const Exporter = require('../../src/exporter');

const config = require('../../config');

describe('exporter', () => {
  const tmpdir = os.tmpdir();
  const currentYYYYMMDD = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todayLog = `/tmp/aabbccddeeff-${currentYYYYMMDD}.json`;

  before(() => {
    config.dashboard.base = '/tmp/';
  });
  afterEach(() => {
    if (fs.existsSync(todayLog)) {
      fs.unlinkSync(todayLog);
    }
  });

  it('should create and append to today log', async() => {
    const exporter = new Exporter('aabbccddeeff', tmpdir);
    await exporter.append({ pi1: -62, pi2: -62, pi3: -78 }, { x: 5, y: 2 });
    await exporter.saveCurrent();

    expect(fs.existsSync(todayLog)).to.be.true;
    expect(fs.readFileSync(todayLog, 'utf8')).to.equal('{"data":[{"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coordinates":{"x":5,"y":2}}]}');
  });

  it('should append to today log', async() => {
    fs.writeFileSync(todayLog, '{"data":[{"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coordinates":{"x":5,"y":2}}]}');
    expect(fs.readFileSync(todayLog, 'utf8')).to.equal('{"data":[{"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coordinates":{"x":5,"y":2}}]}');

    const exporter = new Exporter('aabbccddeeff', tmpdir);
    await exporter.append({ pi1: -90 }, null);
    await exporter.saveCurrent();

    expect(fs.existsSync(todayLog)).to.be.true;
    expect(fs.readFileSync(todayLog, 'utf8')).to.equal('{"data":[{"pool":{"pi1":-62,"pi2":-62,"pi3":-78},"coordinates":{"x":5,"y":2}},{"pool":{"pi1":-90},"coordinates":null}]}');
  });
});
