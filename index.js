const http = require('http');

const router = require('./src/router');
const bluetoothListener = require('./src/bluetoothListener');
const roles = require('./src/role');
const web = require('./src/web');
const Aggregator = require('./src/aggregator');

const logger = require('./lib/logger');
const config = require('./config');

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

Aggregator.instantiateAll();
http.createServer(router).listen(config.port);
bluetoothListener.init();
web.initServer();
