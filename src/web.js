const http = require('http');

const config = require('../config');

module.exports.initServer = function() {
  const server = http.createServer((request, response) => {
    console.log(request.url);
    response.end('Hello Node.js Server!');
  });

  server.listen(port, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
  })
};
