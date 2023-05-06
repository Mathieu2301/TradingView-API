/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const TradingView = require('../main');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async (log, success, warn, err, cb) => {
  if (!process.env.SESSION || !process.env.SIGNATURE) {
    err('No sessionid/signature was provided');
    cb();
    return;
  }

  log('Getting user info');

  const userInfos = await TradingView.getUser(process.env.SESSION, process.env.SIGNATURE);
  if (userInfos && userInfos.id) {
    success('User info:', {
      id: userInfos.id,
      username: userInfos.username,
      firstName: userInfos.firstName,
      lastName: userInfos.lastName,
      following: userInfos.following,
      followers: userInfos.followers,
      notifications: userInfos.notifications,
      joinDate: userInfos.joinDate,
    });
  } else err('Get user error. Result:', userInfos);

  await wait(1000);

  log('Getting user indicators');

  const userIndicators = await TradingView.getPrivateIndicators(process.env.SESSION);
  if (userIndicators) {
    if (userIndicators.length === 0) warn('No private indicator found');
    else success('User indicators:', userIndicators.map((i) => i.name));
  } else err('Get indicators error. Result:', userIndicators);

  await wait(1000);

  log('Creating logged client');
  const client = new TradingView.Client({
    token: process.env.SESSION,
    signature: process.env.SIGNATURE,
  });
  client.onError((...error) => {
    err('Client error', error);
  });

  const chart = new client.Session.Chart();
  chart.onError((...error) => {
    err('Chart error', error);
  });

  log('Setting market to BINANCE:BTCEUR...');
  chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D' });

  const checked = new Set();
  async function check(item) {
    checked.add(item);
    log('Checked:', [...checked], `(${checked.size}/${userIndicators.length + 1})`);
    if (checked.size < userIndicators.length + 1) return;

    log('Closing client...');
    chart.delete();
    await client.end();
    success('Client closed');
    cb();
  }

  chart.onUpdate(async () => {
    success('Market data:', {
      name: chart.infos.pro_name,
      description: chart.infos.short_description,
      exchange: chart.infos.exchange,
      price: chart.periods[0].close,
    });

    await check(Symbol.for('PRICE'));
  });

  await wait(1000);

  log('Loading indicators...');

  for (const indic of userIndicators) {
    const privateIndic = await indic.get();
    log(`[${indic.name}] Loading indicator...`);

    const indicator = new chart.Study(privateIndic);

    indicator.onReady(() => {
      success(`[${indic.name}] Indicator loaded !`);
    });

    indicator.onUpdate(async () => {
      success(`[${indic.name}] Last plot:`, indicator.periods[0]);
      await check(indic.id);
    });
  }
};
