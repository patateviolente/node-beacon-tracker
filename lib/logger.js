const logLevel = 2;

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
  const now = new Date();

  return `[${process.env.WHOAMI}][${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}]`;
}

function pad(str, length = 2, char = '0') {
  return char.repeat(length - `${str}`.length) + str;
}

module.exports.DEBUG = 2;
module.exports.VERBOSE = 3;
