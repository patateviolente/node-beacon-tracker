import * as logger from '../lib/logger';

export function exit(message: string): void {
  logger.error(message);
  process.exit(1);
}
