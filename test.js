/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */

const fs = require('fs');
require('@mathieuc/console')(
  '§', // Character you want to use (defaut: '§')
  true, // Active timestamp (defaut: false)
);

const TESTS = {};

function err(name) {
  return (...msg) => {
    TESTS[name].errors += 1;
    console.error('§30§101 > §0', ...msg);
  };
}

function warn(name) {
  return (...msg) => {
    TESTS[name].warnings += 1;
    console.warn('§30§103 > §0', ...msg);
  };
}

function log() {
  return (...msg) => console.log('§30§107 > §0', ...msg);
}

function success() {
  return (...msg) => console.info('§30§102 > §0', ...msg);
}

(async () => {
  console.info('§90§30§104 ==== Starting tests ==== §0');

  for (const file of fs.readdirSync('./tests').filter((f) => f.endsWith('.js'))) {
    if (process.argv[2] && !file.startsWith(process.argv[2])) continue;
    const test = require(`./tests/${file}`);
    const name = file.replace(/\.js/g, '');
    TESTS[name] = { errors: 0, warnings: 0 };
    console.log(`§90§30§107 ${name}`);
    await new Promise((cb) => test(log(), success(), warn(name), err(name), cb));
  }

  console.info('§90§30§104 ==== ALL TESTS DONE ==== §0\n');
  Object.keys(TESTS).forEach((t) => {
    let color = '2';
    if (TESTS[t].warnings) color = '3';
    if (TESTS[t].errors) color = '1';

    console.info(`§90§30§10${color} ${t} §0 §91E§0: ${TESTS[t].errors}§0 §93W§0: ${TESTS[t].warnings}`);
    // console.info(` - §91 Errors:§0 ${TESTS[t].errors}`);
    // console.info(` - §93 Warnings:§0 ${TESTS[t].warnings}`);
  });

  process.exit(0);
})();

setTimeout(() => {
  console.log('§30§101 TIMEOUT §0');
  throw new Error('Timeout');
}, 60000);
