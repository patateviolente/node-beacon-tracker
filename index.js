const http = require('http');

const router = require('./src/router');
const bluetoothServer = require('./src/bluetoothListener');
const roles = require('./src/role');
const web = require('./src/web');

const logger = require('./lib/logger');
const config = require('./config');

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

http.createServer(router).listen(config.port);
bluetoothServer.init();
web.initServer();
