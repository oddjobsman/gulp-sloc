// originally from the gist - https://gist.github.com/benbuckman/2758563#file-intercept-stdout-js
// thanks to https://github.com/benbuckman for this!
var _ = require('lodash'),
    util = require('util');
 
// intercept stdout, passes thru callback
// also pass console.error thru stdout so it goes to callback too
// (stdout.write and stderr.write are both refs to the same stream.write function)
// returns an unhook() function, call when done intercepting
module.exports = function interceptStdout(callback) {
  var old_stdout_write = process.stdout.write,
      old_console_error = console.error;
 
  process.stdout.write = (function(write) {
    return function(string, encoding, fd) {
      var args = _.toArray(arguments);
 
      // only intercept the string
      callback.call(callback, string);
    };
  }(process.stdout.write));
 
  console.error = (function(log) {
    return function() {
      var args = _.toArray(arguments);
      args.unshift('[ERROR]');
      
      // string here encapsulates all the args
      callback.call(callback, util.format(args));
    };
  }(console.error));
 
  // puts back to original
  return function unhook() {
    process.stdout.write = old_stdout_write;
    console.error = old_console_error;
  };
};