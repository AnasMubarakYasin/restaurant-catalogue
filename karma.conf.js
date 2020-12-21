/* eslint-disable max-len */
// Karma configuration
// Generated on Sat Dec 12 2020 17:46:13 GMT+0800 (Central Indonesia Time)
const fs = require('fs');
const webpackconfig = require('./webpack.dev');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'spec/*',
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'spec/*': ['webpack'],
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'summary'],


    // web server port
    port: 9070,


    // enable / disable colors in the output (reporters and logs)
    colors: true,

    protocol: 'https',

    httpsServerOptions: {
      key: fs.readFileSync('./cert/localhost-key.pem'),
      cert: fs.readFileSync('./cert/localhost.pem'),
    },

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    summaryReporter: {
      // 'failed', 'skipped' or 'all'
      show: 'all',
      // Limit the spec label to this length
      // specLength: 50,
      // Show an 'all' column as a summary
      overviewColumn: true,
    },


    browserNoActivityTimeout: 60 * 1000 * 60,


    webpack: webpackconfig,
    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      // stats: 'errors-only',
    },

  });
};
