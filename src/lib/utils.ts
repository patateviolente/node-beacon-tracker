import * as http from 'http';

import * as logger from './logger';

export function isMac(str) {
  return /^([0-9a-f]{2}:?){6}$/i.test(str);
}

export function round(num, decimals = 2) {
  const pow = Math.pow(10, decimals);
  return Math.round(num * pow) / pow;
}

export function standardizeMac(str) {
  const noSpecialChar = String(str).toLowerCase()
    .replace(/:/g, '');

  return noSpecialChar.match(/.{2}/g).join(':');
}

export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function exit(message) {
  logger.error(message);
  process.exit(1);
}

export function getHttp(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const bodyParts = [];
      response.on('data', (chunk) => bodyParts.push(chunk));
      response.on('end', () => {
        const body = JSON.stringify(bodyParts.join(''));

        return body.error
          ? reject(new Error(body.error))
          : resolve(body);
      });
    });
    request.on('error', (err) => reject(err))
  });
}
