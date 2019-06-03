const config = require('../config');
const utils = require('../lib/utils');

const whoami = process.env.WHOAMI;
const accessPoint = process.env.TESTENV
  ? config.accessPoints[Object.keys(config.accessPoints)[0]]
  : config.accessPoints[whoami];

if (!accessPoint) {
  utils.exit(`WHOAMI env variable is unkown (${whoami}), set value in ${Object.keys(config.accessPoints)}`);
}

module.exports = {
  amIMaster: !!accessPoint.master,
  amISlave: !accessPoint.master,
  role: (accessPoint.master) ? 'master' : 'slave',
  whoami
};
