const strategyToCsv = require('./strategyToCsv');
const alertToBacktest = require('./alertToBacktest');

module.exports = {
  ...strategyToCsv,
  ...alertToBacktest,
};
