import * as http from 'http';

import router from './middlewares/router';
import * as bluetoothListener from './controllers/bluetoothListener';
import * as roles from './controllers/role';
import * as web from './controllers/web';

import Aggregator from './controllers/Aggregator';

import * as logger from './lib/logger';
import {config} from './config';

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

Aggregator.instantiateAll();
http.createServer(router)
  .listen(config.port);
bluetoothListener.init();
web.initServer();
