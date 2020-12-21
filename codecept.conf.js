require('ts-node/register');
const {setHeadlessWhen} = require('@codeceptjs/configure');

// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
  tests: 'e2e/**/*.spec.js',
  output: 'e2e/outputs',
  helpers: {
    // Puppeteer: {
    //   url: 'https://localhost:9060',
    //   show: true,
    //   windowSize: '1360x635',
    //   waitForNavigation: 'networkidle0',
    // },
    Playwright: {
      url: 'https://localhost:9060',
      show: true,
      restart: false,
      windowSize: '1360x635',
      waitForNavigation: 'networkidle0',
    },
  },
  include: {
    I: './steps_file.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'submission_3_fwde',
  plugins: {
    pauseOnFail: {},
    retryFailedStep: {
      enabled: true,
    },
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
  },
};
