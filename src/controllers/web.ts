import * as http from 'http';

import * as Promise from 'bluebird';
import {Request, Response} from 'express';

import {config} from '../config';
import * as logger from '../lib/logger';
import * as utils from '../utils/strings';
import Exporter, {ExportData} from './Exporter';

import {HttpError} from '../lib/errors';

import * as role from './role';

export function initServer() {
  if (!role.amIMaster) {
    return false;
  }

  http.createServer((req: Request, res: Response) => {
    return routeWeb(req)
      .then(json => res.end(JSON.stringify(json)))
      .catch((e) => {
        const code = e.code || 500;
        logger.error(`[${code}] ${req.url} ${e.message}`);
        if (res) {
          res.writeHead(code, {'content-type': 'application/json'});

          return res.end(JSON.stringify({error: e.message}));
        }
      });
  }).listen(config.dashboard.port);
  logger.log(`dashboard is listening on ${config.dashboard.port}`)
}

function routeWeb(req: Request): Promise<ExportData> {
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
