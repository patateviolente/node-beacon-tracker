import {config} from '../config';
import * as envUtils from '../utils/env';

const whoami = process.env.WHOAMI;
const accessPoint = process.env.TESTENV
  ? config.accessPoints[Object.keys(config.accessPoints)[0]]
  : config.accessPoints[whoami];

if (!accessPoint) {
  envUtils.exit(`WHOAMI env variable is unkown (${whoami}), set value in ${Object.keys(config.accessPoints)}`);
}

const amIMaster = !!accessPoint.master;
const role = (accessPoint.master) ? 'master' : 'slave';

export {
  amIMaster,
  role,
  whoami
};
