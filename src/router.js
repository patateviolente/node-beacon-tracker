const Promise = require('bluebird');

const config = require('../config');
const role = require('../src/role');
const utils = require('../lib/utils');
const receiver = require('./aggregator');

const HttpError = require('../lib/errors').HttpError;

module.exports = function(req, res) {
  return Promise.try(() => {
    const url = req.url;
    if (url.startsWith('/notify/') && role.amIMaster) {
      return notify(req);
    }
    if (url === '/config') {
      return getConfig(req, res);
    }

    return notFound(req, res);
  })
    .then((json) => {
      return res ? res.end(json) : json;
    })
    .catch((e) => {
      console.log(e);
      if (res) {
        res.writeHead(e.code || 500, { 'content-type': 'application/json' });

        return res.end({ error: e.message });
      }
    });
};

function notify(req) {
  const notifyUrl = req.url.replace(/^\/notify\//, '');
  const params = notifyUrl.split('/');

  // Transmitted /notify/apName/mac/rssi from slave
  if (Object.keys(config.accessPoints).includes(params[0])
    && utils.isMac(params[1])
    && utils.isNumeric(params[2])) {
    return receiver.slaveReport(params[0], params[1], parseFloat(params[2]));
  }

  throw new HttpError(400, `Route ${req.url} invalid`);
}

function getConfig() {
  return config;
}

function notFound(req) {
  throw new HttpError(404, `Route ${req.url} unknown`);
}
