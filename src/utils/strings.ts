export function isMac(str) {
  return /^([0-9a-f]{2}:?){6}$/i.test(str);
}

export function round(num, decimals = 2) {
  const pow = Math.pow(10, decimals);
  return Math.round(num * pow) / pow;
}

export function standardizeMac(str: String) {
  const noSpecialChar = String(str).toLowerCase()
    .replace(/:/g, '');

  return noSpecialChar.match(/.{2}/g).join(':');
}

export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
