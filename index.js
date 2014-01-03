'use strict';

var fs = require('fs');
var path = require('path');

var es = require('event-stream');
var gutil = require('gulp-util');
var sloc = require('sloc');

function gulpSloc(options) {
  function resetCounters() {
    return { loc: 0, sloc: 0, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 0 };
  }

  var supportedExtensions = [ 'js', 'cc', 'c', 'coffeescript', 'coffee', 'python', 'py', 'java', 'php' ];
  var counters = resetCounters();
  var log = gutil.log;
  var colors = gutil.colors;
  
  function writeJsonReport() {
    if (!options.reportPath)
      log(colors.yellow('Please specify the reporting path.'));

    fs.writeFileSync(options.reportPath, JSON.stringify(counters, null, 2));
    log('Create at: ' + colors.purple(options.reportPath));
  }

  function printReport() {
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
  }

  function calcSloc(file) {
    var source = String(file.contents);
    var ext = path.extname(file.path);

    if (!ext)
      return;

    ext = (ext.charAt(0) === '.') ? ext.substr(1, ext.length) : ext;

    // if we're tolerant and we didnt find the file extension, treat as JavaScript file
    // else say b'bye!
    if (options.tolerant && supportedExtensions.indexOf(ext) < 0) ext = 'js';
    if (supportedExtensions.indexOf(ext) < 0) return;

    var stats = sloc(source, ext);

    // iterates through loc, sloc, cloc, scloc, mcloc, nloc
    Object.getOwnPropertyNames(stats).forEach(function (key) {
      counters[key] += stats[key];
    });

    counters.file += 1;
  }
}