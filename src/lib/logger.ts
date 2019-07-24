const logLevel = process.env.LOGLEVEL || 2;

export function log(message, level = 0) {
  if (level <= logLevel && !process.env.TESTENV) {
    console.log(`${timestamp()} ${message}`);
  }
}

export function error(message) {
  if (!process.env.TESTENV) {
    console.error(`${timestamp()}[!!] ${message}`);
  }
}

function timestamp() {
  return `[${process.env.WHOAMI}][${new Date().toISOString().substring(0, 23).replace(/[-]/g, '').replace('T', '-')}]`;
}

export const DEBUG: number = 2;
export const VERBOSE: number = 3;
export const EXPERIMENT: number = 4;
