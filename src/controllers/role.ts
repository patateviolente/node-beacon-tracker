import { config } from '../config';
import * as envUtils from '../utils/env';

export const whoami = process.env.WHOAMI;
const accessPoint = process.env.TESTENV
  ? config.accessPoints[Object.keys(config.accessPoints)[0]]
  : config.accessPoints[whoami];

if (!accessPoint) {
  envUtils.exit(`WHOAMI env variable is unkown (${whoami}), set value in ${Object.keys(config.accessPoints)}`);
}

export const role: 'master' | 'slave' = (accessPoint.master) ? 'master' : 'slave';

