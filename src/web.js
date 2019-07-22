const http = require('http');

const config = require('../config');
const role = require('../role');
const logger = require('../lib/logger');

module.exports.initServer = function() {
  if (!role.amIMaster) {
    return false;
  }

  http.createServer(routeWeb)
    .listen(config.dashboard.port);
  logger.log(`dashboard is listening on ${config.dashboard.port}`)
};

function routeWeb(req, res) {
  logger.log(req.url);
  res.end('Hello Node.js Server!');
}
