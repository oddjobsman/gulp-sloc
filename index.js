'use strict';

var fs = require('pa')
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');

function gulpSloc(options) {
  var supportedExtensions = [ 'js', 'cc', 'c', 'coffeescript', 'coffee', 'python', 'py', 'java', 'php' ];

  function resetCounter() {
    return { loc: 0, sloc: 0, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 0 };
  }

  function writeJsonReport() {
    if (!options.reportPath) {
      grunt.log.warn('Please specify the reporting path.');
    }

    grunt.file.write(options.reportPath, JSON.stringify(count, null, 2));
    grunt.log.writeln('Create at: '+ options.reportPath.cyan);
  }

  function printReport() {
    var log = gutil.log;
    var colors = gutil.colors;

    log('-------------------------------');
    log('        physical lines : '+ colors.green(String(count.loc)));
    log('  lines of source code : '+ colors.green(String(count.sloc)));
    log('         total comment : '+ colors.cyan(String(count.cloc)));
    log('            singleline : '+ String(count.scloc));
    log('             multiline : '+ String(count.mcloc));
    log('                 empty : '+ colors.red(String(count.nloc)));
    log('');
    log('  number of files read : '+ colors.green(String(count.file));

    var modeMessage = options.tolerant ? 
                  colors.yellow('         tolerant mode ') : 
                  colors.red('           strict mode ');

    log(modeMessage);
    log('-------------------------------');
  }

  function calcSloc(file) {
    var count = resetCounter();
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
      count[key] += stats[key];
    });

    count.file ++;
  }
}