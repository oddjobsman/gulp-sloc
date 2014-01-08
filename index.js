'use strict';

var path = require('path');
var _ = require('lodash');
var es = require('event-stream');
var gutil = require('gulp-util');
var sloc = require('sloc');

function gulpSloc(options) {
  var supportedExtensions = ['js', 'cc', 'c', 'coffeescript', 'coffee', 'python', 'py', 'java', 'php'];
  var log = gutil.log;
  var colors = gutil.colors;
  var File = gutil.File;

  options = _.extend({
    tolerant: false,
    reportType: 'stdout',
    reportFile: 'sloc.json'
  }, (options || {}));

  if (options.reportType === 'json' && _.isEmpty(options.reportFile)) {
    throw new gutil.PluginError('gulp-sloc', 'Invalid report file. Provide a valid file name for reportFile in options.');
  }

  return (function () {

    var counters = { loc: 0, sloc: 0, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 0 };

    function writeJsonReport() {
      /*jshint validthis: true*/

      var reportFile = new File({
        path: options.reportFile,
        contents: new Buffer(JSON.stringify(counters))
      });

      this.emit('data', reportFile);
      this.emit('end');
    }

    function calculateSloc(file) {
      var source = file.contents.toString('utf8');
      var ext = path.extname(file.path);

      if (!ext)
        return;

      ext = (ext.charAt(0) === '.') ? ext.substr(1, ext.length) : ext;

      // if we're tolerant and we didnt find the file extension, treat as JavaScript file
      // else say b'bye!
      if (options.tolerant && supportedExtensions.indexOf(ext) < 0) ext = 'js';
      else if (supportedExtensions.indexOf(ext) < 0) return;

      var stats = sloc(source, ext);

      // iterates through loc, sloc, cloc, scloc, mcloc, nloc
      Object.getOwnPropertyNames(stats).forEach(function (key) {
        counters[key] += stats[key];
      });

      counters.file += 1;
    }

    function printReport() {
      /*jshint validthis: true*/

      log('-------------------------------');
      log('        physical lines : ' + colors.green(String(counters.loc)));
      log('  lines of source code : ' + colors.green(String(counters.sloc)));
      log('         total comment : ' + colors.cyan(String(counters.cloc)));
      log('            singleline : ' + String(counters.scloc));
      log('             multiline : ' + String(counters.mcloc));
      log('                 empty : ' + colors.red(String(counters.nloc)));
      log('');
      log('  number of files read : ' + colors.green(String(counters.file)));

      var modeMessage = options.tolerant ?
                    colors.yellow('         tolerant mode ') :
                    colors.red('           strict mode ');

      log(modeMessage);
      log('-------------------------------');

      this.emit('end');
    }

    var last = options.reportType === 'json' ? writeJsonReport : printReport;

    return es.through(calculateSloc, last);
  })();
}

module.exports = gulpSloc;