const logLevel = 2;

module.exports.log = function(message, level = 0) {
  if (level <= logLevel) {
    console.log(message);
  }
};

module.exports.error = function(message) {
  console.error(message);
};

module.exports.DEBUG = 2;
module.exports.VERBOSE = 3;
