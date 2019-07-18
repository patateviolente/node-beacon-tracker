import * as Promise from 'bluebird'

import * as config from '../config';
import * as role from './/role';
import * as utils from '../lib/utils';
import * as logger from '../lib/logger';
import * as Aggregator from './aggregator';

import HttpError from '../lib/errors';

export function (req, res) {
  return Promise.try(() => {
    const url = req.url;
    if (url.startsWith('/notify/')) {
      if (!role.amIMaster) {
        throw new HttpError(401, 'Not a master, cannot process notify calls');
      }

      return notify(req)
        .tap(output => logger.log(`[200] ${req.url} ${output || ''}`, logger.VERBOSE))
        .then(output => res.end(JSON.stringify(output)));
    }

    return notFound(req);
  })
    .then(json => (res && res.end(JSON.stringify(json)) || json))
    .catch((e) => {
      const code = e.code || 500;
      logger.error(`[${code}] ${req.url} ${e.message}`);
      if (res) {
        res.writeHead(code, {'content-type': 'application/json'});

        return res.end(JSON.stringify({error: e.message}));
      }
    });
}

function notify(req) {
  return Promise.try(() => {
    const notifyUrl = req.url.replace(/^\/notify\//, '');
    const params = notifyUrl.split('/');

    // Transmitted /notify/apName/mac/rssi from slave
    if (Object.keys(config.accessPoints).includes(params[0])
      && utils.isMac(params[1])
      && utils.isNumeric(params[2])) {
      return Aggregator.byMAC(params[1]).slaveReport(params[0], parseFloat(params[2]));
    }

    throw new HttpError(400, `Route ${req.url} invalid`);
  });
}

function notFound(req) {
  throw new HttpError(404, `Route ${req.url} unknown`);
}
