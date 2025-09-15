const calculateLinReg = (data) => {
  const n = data.length;
  const sumX = data.reduce((sum, _, index) => sum + index, 0); // Assuming indices as x values
  const sumY = data.reduce((sum, value) => sum + value, 0);
  const sumXY = data.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = data.reduce((sum, _, index) => sum + index * index, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const getPnlByDaysAgo = (trades, equity, profit) => {
  let { pnlAtDay90, pnlAtDay30, pnlAtDay7 } = { pnlAtDay90: 0, pnlAtDay30: 0, pnlAtDay7: 0 };

  const daysInMilliseconds = (days) => Date.now() - days * 24 * 60 * 60 * 1000;
  const target90Ms = daysInMilliseconds(90);
  const target30Ms = daysInMilliseconds(30);
  const target7Ms = daysInMilliseconds(7);

  const recentTrades90 = trades.filter(({ entry }) => entry.time > target90Ms);
  const recentTrades30 = recentTrades90.filter(({ entry }) => entry.time > target30Ms);
  const recentTrades7 = recentTrades30.filter(({ entry }) => entry.time > target7Ms);

  if (recentTrades90.length) pnlAtDay90 = equity[trades.length - recentTrades90.length] - 100;
  if (recentTrades30.length) pnlAtDay30 = equity[trades.length - recentTrades30.length] - 100;
  if (recentTrades7.length) pnlAtDay7 = equity[trades.length - recentTrades7.length] - 100;

  return {
    pnl90: pnlAtDay90 ? ((profit - pnlAtDay90) / Math.abs(pnlAtDay90)) * 100 : 0,
    pnl30: pnlAtDay30 ? ((profit - pnlAtDay30) / Math.abs(pnlAtDay30)) * 100 : 0,
    pnl7: pnlAtDay7 ? ((profit - pnlAtDay7) / Math.abs(pnlAtDay7)) * 100 : 0,
  };
};

const calculateCGR = (startValue, endValue, periods) => Math.round((Math.pow(endValue / startValue, 1 / periods) - 1) * 100 * 100) / 100;

const calculateRSquared = (actual) => {
  const { slope, intercept } = calculateLinReg(actual);

  const predicted = actual.map((_, index) => slope * index + intercept);
  const meanActual = actual.reduce((sum, value) => sum + value, 0) / actual.length;

  let sse = 0;
  let sst = 0;

  for (let i = 0; i < actual.length; i++) {
    sse += Math.pow(actual[i] - predicted[i], 2);
    sst += Math.pow(actual[i] - meanActual, 2);
  }

  const r2 = 1 - sse / sst;
  return {
    rSquared: r2.toFixed(2),
    predicted: predicted.map((num) => Math.round((num / 100) * 100) / 100),
  };
};

module.exports = {
  getPnlByDaysAgo,
  calculateCGR,
  calculateRSquared,
};
