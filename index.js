const http = require('http');

const router = require('./src/router');
const bluetoothServer = require('./src/bluetoothListener');
const roles = require('./src/role');
const web = require('./src/web');

const logger = require('./lib/logger');
const config = require('./config');

// TODO create configurable timeout for aggregator
// TODO for aggregator, allow several call for a same AP, and take the better signal
// TODO for aggregator, add configuration to whether process position whe all APP responds, or process position at custom intervals
// TODO log when receiving aggregate call from slaves (debug)
// TODO supervisord use node instead of npm call

logger.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

http.createServer(router).listen(config.port);
bluetoothServer.init();
web.initServer();
