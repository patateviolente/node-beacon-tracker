import * as http from 'http';

import * as Promise from 'bluebird';

import {config} from '../../src/config';
import * as logger from '../lib/logger';
import * as utils from '../lib/utils';
import * as Exporter from '../../src/src/exporter';

import HttpError from '../../src/lib/errors';

import * as role from './role';

global.Promise = Promise;

export function initServer() {
  if (!role.amIMaster) {
    return false;
  }

  http.createServer((req, res) => {
    return routeWeb(req)
      .then(json => (res && res.end(JSON.stringify(json)) || json))
      .catch((e) => {
        const code = e.code || 500;
        logger.error(`[${code}] ${req.url} ${e.message}`);
        if (res) {
          res.writeHead(code, { 'content-type': 'application/json' });

          return res.end(JSON.stringify({ error: e.message }));
        }
      });
  }).listen(config.dashboard.port);
  logger.log(`dashboard is listening on ${config.dashboard.port}`)
}

function routeWeb(req) {
  return Promise.try(() => {
    const params = req.url.split('/');
    if (params.length !== 3 || !utils.isMac(params[1]) || !params[2].match(/^\d{8}$/)) {
      throw new HttpError(400, `Expecting format /aabbccddeeff/YYYYMMDD mac/date in ${req.url}`);
    }

    logger.log(`Exporting ${req.url}`);
    const exportForDate = new Exporter(params[1]);

    return exportForDate.load(params[2]);
  });
}
