'use strict';

var fs = require('fs');

var gulp = require('gulp');
var tasks = require('gulp-load-plugins')({scope: ['devDependencies']});

var plumber = tasks.plumber;

gulp.task('lint', function (done) {
  var jshint = tasks.jshint,
      stylish = require('jshint-stylish'),
      config = JSON.parse(String(fs.readFileSync('./.jshintrc', 'utf8')));

  gulp.src(['./gulpfile.js', './index.js', './test/sloc.test.js'])
    .pipe(plumber())
    .pipe(jshint(config))
    .pipe(jshint.reporter(stylish))
    .on('end', done);
});

gulp.task('test', ['lint'], function (done) {
  gulp.src('./test/**/*.js')
    .pipe(plumber())
    .pipe(tasks.mocha({reporter: 'spec'}))
    .on('end', done);
});

gulp.task('sloc', ['test'], function (done) {
  var sloc = require('./index');

  gulp.src(['./gulpfile.js', './index.js'])
    .pipe(plumber())
    .pipe(sloc())
    .on('end', done);
});

gulp.task('default', ['sloc'], function () {
  gulp.watch(['./gulpfile.js', './index.js'], function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    gulp.start('sloc');
  });
});

gulp.task('ci', ['sloc'], function () {});
