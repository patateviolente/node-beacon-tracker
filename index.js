const http = require('http');

const router = require('./src/router');
const bluetoothServer = require('./src/bluetoothListener');
const roles = require('./src/role');
const web = require('./src/web');

const logger = require('./lib/logger');
const config = require('./config');

// TODO for aggregator, process position at fixed intervals
// TODO log when receiving aggregate call from slaves (debug)
// TODO supervisord use node instead of npm call

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

http.createServer(router).listen(config.port);
bluetoothServer.init();
web.initServer();
