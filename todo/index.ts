import * as http from 'http';

import * as router from './ts/router';
import * as bluetoothListener from './ts/bluetoothListener';
import * as roles from './ts/role';
import * as web from './ts/web';
import * as Aggregator from './ts/aggregator';

import * as logger from './lib/logger';
import {config} from '../src/config';

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

Aggregator.instantiateAll();
http.createServer(router).listen(config.port);
bluetoothListener.init();
web.initServer();
