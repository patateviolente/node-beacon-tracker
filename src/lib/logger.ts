const logLevel = process.env.LOGLEVEL || 2;

export function log(message: string, level = 0): void {
  if (level <= logLevel && !process.env.TESTENV) {
    console.log(`${timestamp()} ${message}`);
  }
}

export function error(message: string): void {
  if (!process.env.TESTENV) {
    console.error(`${timestamp()}[!!] ${message}`);
  }
}

function timestamp(): string {
  return `[${process.env.WHOAMI}][${new Date().toISOString().substring(0, 23).replace(/[-]/g, '').replace('T', '-')}]`;
}

export enum LOGLEVEL {
  DEBUG = 2,
  VERBOSE = 3,
  EXPERIMENT = 4,
}
