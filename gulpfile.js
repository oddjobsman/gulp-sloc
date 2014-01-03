'use strict';

var fs = require('fs');
var gulp = require('gulp');
var tasks = require('gulp-load-tasks')({scope: ['devDependencies']});

function loadJsHintConfig() {
  return JSON.parse(String(fs.readFileSync('./.jshintrc', 'utf8')));
}

gulp.task('lint', function () {
  var jshint = tasks.jshint,
      config = loadJsHintConfig();

  gulp.src(['./gulpfile.js', './index.js'])
    .pipe(jshint(config))
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
  gulp.src('./test/**/*.js')
    .pipe(tasks.mocha({reporter: 'spec'}));
});

gulp.task('default', ['lint', 'test'], function () {
  gulp.watch(['./gulpfile.js', './index.js'], function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    gulp.run('lint', 'test');
  })
});

gulp.task('ci', ['lint', 'test'], function () {});