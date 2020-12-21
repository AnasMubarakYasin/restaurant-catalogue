/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const directory = path.resolve(__dirname, 'src/public/images');

const target = directory;

const blacklist = [/logo/, /svg/];
const formatEntries = [
  {
    filenameFunc(filename = '') {
      return filename.split(/\./).join('_'+ this.width +'.');
    },
    width: 480,
  }, {
    filenameFunc(filename = '') {
      return filename.split(/\./).join('_'+ this.width +'.');
    },
    width: 720,
  },
];

readdir(target, blacklist);

function readdir(target = '', blacklist = [/./], base = __dirname) {
  target = path.isAbsolute(target) ? target : path.resolve(base, target);
  return recur(target);
  function recur(target = '') {
    if (fs.existsSync(target) === false) {
      console.error('your target is not exist', target);

      return;
    }
    fs.
        readdirSync(target).
        forEach((dirname) => {
          const exclude = blacklist.some((exclude) => {
            return exclude.test(dirname);
          });
          const destination = path.resolve(target, dirname);
          if (exclude === false) {
            if (path.extname(dirname)) {
              convert(destination, formatEntries);
            } else {
              recur(destination);
            }
          }
        });
  }
}
function convert(target = '', formatEntries = [{filenameFunc: (dirname = '') => '', width: 0, height: 0}]) {
  formatEntries.
      forEach((format) => {
        const destination = format.filenameFunc(target);
        if (destination === '') {
          console.error('destination not exist', destination);

          return;
        }
        sharp(target).
            resize(format.width, format.height).
            toFile(destination);
        console.log('build image', target, 'success');
      });
}
