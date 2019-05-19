const http = require('http');

module.exports.isMac = function(str) {
  return /^([0-9a-f]{2}:?){6}$/i.test(str);
};

module.exports.standardizeMac = function(str) {
  const noSpecialChar = String(str).toLowerCase()
    .replace(/:/g, '');

  return noSpecialChar.match(/.{2}/g).join(':');
};

module.exports.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports.exit = function(message) {
  console.error(message);
  process.exit(1);
};

module.exports.getHttp = function(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => {
        const body = JSON.stringify(body.join(''));

        return body.error
          ? reject(new Error(body.error))
          : resolve(body);
      });
    });
    request.on('error', (err) => reject(err))
  });
};
