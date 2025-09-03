const { createLayout } = require('../../main');

if (!process.env.SESSION || !process.env.SIGNATURE) throw Error('Please set your sessionid and signature cookies');

const layoutName = 'Dziwne Me Baby';
const symbolId = 'XTVCUSDT';
const symbol = 'BYBIT:BTCUSDT.P';
const interval = '59';
const studyId = 'sqU6MY'; // TODO:: checking: what is this
const indicatorId = 'PUB;fd7b861860564a86920a1b616fe98f54';
const indicatorValues = { in_18: 9.9 };

(async () => {
  const layoutUrl = await createLayout(
    layoutName,
    symbolId,
    symbol,
    interval,
    studyId,
    indicatorId,
    indicatorValues,
    process.env.SESSION,
    process.env.SIGNATURE,
  );

  console.log(`https://www.tradingview.com/chart/${layoutUrl}`);
})();
