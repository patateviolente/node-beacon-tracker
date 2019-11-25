const logLevel = process.env.LOGLEVEL || 2;

module.exports.log = function(message, level = 0) {
  if (level <= logLevel && !process.env.TESTENV) {
    console.log(`${timestamp()} ${message}`);
  }
};

module.exports.error = function(message) {
  if (!process.env.TESTENV) {
    console.error(`${timestamp()}[!!] ${message}`);
  }
};

function timestamp() {
  return `[${process.env.WHOAMI}][${new Date().toISOString().substring(0, 23).replace(/[-]/g, '').replace('T', '-')}]`;
}

module.exports.DEBUG = 2;
module.exports.VERBOSE = 3;
module.exports.EXPERIMENT = 4;
