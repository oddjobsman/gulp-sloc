'use strict';

var fs = require('fs');
var gulp = require('gulp');
var tasks = require('gulp-load-tasks')({scope: ['devDependencies']});
var stylish = require('jshint-stylish');

var sloc = require('./index');

function loadJsHintConfig() {
  return JSON.parse(String(fs.readFileSync('./.jshintrc', 'utf8')));
}

gulp.task('lint', function () {
  var jshint = tasks.jshint,
      config = loadJsHintConfig();

  gulp.src(['./gulpfile.js', './index.js'])
    .pipe(jshint(config))
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', function () {
  gulp.src('./test/**/*.js')
    .pipe(tasks.mocha({reporter: 'spec'}));
});

gulp.task('sloc', function () {
  gulp.src(['./gulpfile.js', './index.js'])
    .pipe(sloc())
    .pipe(gulp.dest('./output/'));
});

gulp.task('default', ['lint', 'test', 'sloc'], function () {
  gulp.watch(['./gulpfile.js', './index.js'], function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    gulp.run('lint', 'test', 'sloc');
  });
});

gulp.task('ci', ['lint', 'test', 'sloc'], function () {});