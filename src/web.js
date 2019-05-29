const http = require('http');

const config = require('../config');

module.exports.initServer = function() {
  if (!config.dashboard.enable) {
    return false;
  }

  http.createServer(routeWeb)
    .listen(config.dashboard.port);
  console.log(`dashboard is listening on ${config.dashboard.port}`)
};

function routeWeb(req, res) {
  console.log(req.url);
  res.end('Hello Node.js Server!');
}
