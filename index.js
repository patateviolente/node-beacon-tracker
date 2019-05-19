const http = require('http');

const router = require('./src/router');
const bluetoothServer = require('./src/bluetoothListener');
const roles = require('./src/role');

const config = require('./config');

// HTTP server
http.createServer(router)
  .listen(config.port);
console.log(`Listening on ${config.port} as ${roles.whoami} (${roles.role})`);

// Bluetooth listener
bluetoothServer.init();
