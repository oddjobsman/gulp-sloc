'use strict';

var path = require('path');
var util = require('util');

var _ = require('lodash');
var expect = require('expect.js');
var gutil = require('gulp-util');

var File = gutil.File;
var colors = gutil.colors;
var interceptStdout = require('./intercept_stdout');

var sloc = require('../');

function makeFakeFile(filePath, contents) {
  return new File({
    cwd: path.dirname(path.dirname(filePath)),
    base: path.dirname(path.dirname(filePath)),
    path: filePath,
    contents: new Buffer((contents || ''))
  });
}

function validateOutput(lines, counters, strict) {
  expect(lines[0]).to.be(util.format('[%s] -------------------------------', colors.green('gulp')));
  expect(lines[1]).to.be(util.format('[%s]         physical lines : %s', colors.green('gulp'), colors.green(String(counters.loc))));
  expect(lines[2]).to.be(util.format('[%s]   lines of source code : %s', colors.green('gulp'), colors.green(String(counters.sloc))));
  expect(lines[3]).to.be(util.format('[%s]          total comment : %s', colors.green('gulp'), colors.cyan(String(counters.cloc))));
  expect(lines[4]).to.be(util.format('[%s]             singleline : %s', colors.green('gulp'), String(counters.scloc)));
  expect(lines[5]).to.be(util.format('[%s]              multiline : %s', colors.green('gulp'), String(counters.mcloc)));
  expect(lines[6]).to.be(util.format('[%s]                  empty : %s', colors.green('gulp'), colors.red(String(counters.nloc))));
  expect(lines[7]).to.be(util.format('[%s] ', colors.green('gulp')));
  expect(lines[8]).to.be(util.format('[%s]   number of files read : %s', colors.green('gulp'), colors.green(String(counters.file))));

  if (strict) {
    expect(lines[9]).to.be(util.format('[%s] %s', colors.green('gulp'), colors.red('           strict mode ')));
  } else {
    expect(lines[9]).to.be(util.format('[%s] %s', colors.green('gulp'), colors.yellow('         tolerant mode ')));
  }

  expect(lines[10]).to.be(util.format('[%s] -------------------------------', colors.green('gulp')));
}

describe('gulp-sloc', function () {
  describe('sloc()', function () {
    var writtenValue;

    function updateConsoleValue(value) {
      writtenValue += value;
    }

    beforeEach(function () {
      writtenValue = '';
    });

    it('should calculate sloc in strict mode on a single input file and print to console by default', function (done) {
      var stream = sloc();
      var restoreStdout;

      stream.on('end', function () {
        var lines = writtenValue.split('\n');

        try {
          validateOutput(lines, {loc: 1, sloc: 1, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 1}, true);

          restoreStdout();
          done();
        } catch (e) {
          restoreStdout();
          return done(e);
        }
      });

      restoreStdout = interceptStdout(updateConsoleValue);
      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.end();
    });

    it('should calculate sloc in strict mode on all specified input files and print to console by default', function (done) {
      var stream = sloc();
      var restoreStdout;

      stream.on('error', function () {
        console.log('Error!');
      });
    
      stream.on('end', function () {
        var lines = writtenValue.split('\n');

        try {
          validateOutput(lines, {loc: 2, sloc: 2, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 2}, true);

          restoreStdout();
          done();
        } catch (e) {
          restoreStdout();
          return done(e);
        }
      });

      restoreStdout = interceptStdout(updateConsoleValue);
      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file should be ignored
      stream.end();
    });

    it('should calculate sloc in tolerant mode on all specified input files and print to console by default', function (done) {
      var stream = sloc({
        tolerant: true
      });
      var restoreStdout;

      stream.on('end', function () {
        var lines = writtenValue.split('\n');

        try {
          validateOutput(lines, {loc: 3, sloc: 3, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 3}, false);

          restoreStdout();
          done();
        } catch (e) {
          restoreStdout();
          return done(e);
        }
      });

      restoreStdout = interceptStdout(updateConsoleValue);
      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file not should be ignored
      stream.end();
    });

    it('should calculate sloc in strict mode on all specified input files and send Json file downstream with default filename', function (done) {
      var stream = sloc({
        reportType: 'json'
      });
      var expectedResults = {loc: 2, sloc: 2, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 2};

      stream.on('data', function (file) {
        expect(path.basename(file.path)).to.be('sloc.json');

        var results = JSON.parse(file.contents.toString('utf8'));

        _.each(expectedResults, function (value, key) {
          expect(results[key]).to.be(value);
        });

        done();
      });

      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file should be ignored
      stream.end();
    });

    it('should calculate sloc in strict mode on all specified input files and send Json file downstream with specified filename', function (done) {
      var stream = sloc({
        reportType: 'json',
        reportFile: 'all.json'
      });
      var expectedResults = {loc: 2, sloc: 2, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 2};

      stream.on('data', function (file) {
        expect(path.basename(file.path)).to.be('all.json');

        var results = JSON.parse(file.contents.toString('utf8'));

        _.each(expectedResults, function (value, key) {
          expect(results[key]).to.be(value);
        });

        done();
      });

      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file should be ignored
      stream.end();
    });

    it('should calculate sloc in tolerant mode on all specified input files and send Json file downstream with default filename', function (done) {
      var stream = sloc({
        tolerant: true,
        reportType: 'json'
      });
      var expectedResults = {loc: 3, sloc: 3, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 3};

      stream.on('data', function (file) {
        expect(path.basename(file.path)).to.be('sloc.json');

        var results = JSON.parse(file.contents.toString('utf8'));

        _.each(expectedResults, function (value, key) {
          expect(results[key]).to.be(value);
        });

        done();
      });

      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file should not be ignored
      stream.end();
    });

    it('should calculate sloc in tolerant mode on all specified input files and send Json file downstream with specified filename', function (done) {
      var stream = sloc({
        tolerant: true,
        reportType: 'json',
        reportFile: 'all.json'
      });
      var expectedResults = {loc: 3, sloc: 3, cloc: 0, scloc: 0, mcloc: 0, nloc: 0, file: 3};

      stream.on('data', function (file) {
        expect(path.basename(file.path)).to.be('all.json');

        var results = JSON.parse(file.contents.toString('utf8'));

        _.each(expectedResults, function (value, key) {
          expect(results[key]).to.be(value);
        });

        done();
      });

      stream.write(makeFakeFile('/a/b/foo.js', 'var a = 10;'));
      stream.write(makeFakeFile('/a/b/boo.js', 'var a = 10, b= 20;'));
      stream.write(makeFakeFile('/a/b/moo.bak', 'var a = 10, b= 20;'));   // this file should not be ignored
      stream.end();
    });

  });
});