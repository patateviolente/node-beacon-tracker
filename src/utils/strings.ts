export function isMac(str: string): boolean {
  return /^([0-9a-f]{2}:?){6}$/i.test(str);
}

export function round(num: number, decimals = 2): number {
  const pow = Math.pow(10, decimals);
  return Math.round(num * pow) / pow;
}

export function standardizeMac(str: string): string {
  const noSpecialChar = String(str).toLowerCase()
    .replace(/:/g, '');

  return noSpecialChar.match(/.{2}/g).join(':');
}

export function isNumeric(n: any): boolean {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function dateToYYYYMMDD(date: Date): string {
  return date.toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
}
