import * as logger from "../lib/logger";

export function exit(message) {
  logger.error(message);
  process.exit(1);
}
