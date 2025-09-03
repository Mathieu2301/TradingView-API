const TradingView = require('../../main');

if (!process.env.SESSION || !process.env.SIGNATURE) throw Error('Please set your sessionid and signature cookies');

// WORKING
// Replace this with your own alertName
// const alertQuery = '#22';
// const alertQuery = '#39';
// const alertQuery = '#43';

// NOT WORKING
// const alertQuery = '#99';
// const alertQuery = '#100';
const alertQuery = 'henrik';

(async () => {
  const alerts = await TradingView.getAlerts(process.env.SESSION, process.env.SIGNATURE);
  const filteredAlerts = alerts.map(({
    resolution, symbol, name, condition, active, ...rest
  }) => ({
    resolution,
    symbol,
    name,
    condition,
    active,
    ...rest,
  }));

  const alert = await filteredAlerts.filter((a) => a.name.includes(alertQuery))[0];
  if (!alert) throw Error('Alert not found');

  const result = await TradingView.alertToBacktest(alert, process.env.SESSION, process.env.SIGNATURE);

  const {
    strategyReport: {
      history: { equityPercent },
      performance: { all },
    },
  } = result;
  console.log(all);
})();
