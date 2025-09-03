const { BuiltInIndicator, getIndicator } = require('../miscRequests');

const alertToBacktest = async (alert, sessionId, sessionSign, server = 'prodata') => new Promise(async (resolve, reject) => {
  // eslint-disable-next-line camelcase
  const { pine_id, inputs } = alert.condition.series[0];
  const symbol = alert.symbol.match(/"symbol":"([^"]+)"/)[1];

  const client = new this.Client({
    server,
    token: sessionId,
    signature: sessionSign,
  });

  client.onError(() => {
    client.end();
    return reject(Error('[TRADINGVIEW]: Client error'));
  });

  const chart = new client.Session.Chart();
  chart.setMarket(symbol, { timeframe: `${alert.resolution}`, range: 99999 });

  chart.onError(() => {
    client.end();
    return reject(Error('[TRADINGVIEW]: chart error'));
  });

  const indicator = await getIndicator(pine_id, 'last', sessionId, sessionSign);

  const extIndicators = {};

  for (const key of Object.keys(inputs)) {
    const input = indicator.inputs[key];
    const value = inputs[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const scriptId = value.pine_id;

      // const isPersonalIdicator = value.pine_id?.startsWith('USER;');
      const isPublicUserIndicator = value.pine_id?.startsWith('PUB;');
      const isTvGeneralIndicator = value.pine_id?.startsWith('STD;');
      const isBuiltinIndicator = !value.pine_id;

      if (!extIndicators[value.pine_id]) {
        const externalIndicator = isBuiltinIndicator
          ? await new BuiltInIndicator(value.study)
          : await getIndicator(scriptId, 'last', sessionId, sessionSign);

        if (isPublicUserIndicator) {
          for (const k in value.inputs) {
            const i = externalIndicator.inputs?.[k];
            if (i == null) continue;
            i.value = value.inputs[k];
          }
        }

        const study = new chart.Study(externalIndicator);
        if (isTvGeneralIndicator) {
          for (const ke in value.inputs) {
            const i = externalIndicator.inputs?.[ke];
            if (i == null) continue;
            i.value = value.inputs[ke];
          }
        }

        if (isBuiltinIndicator) {
          for (const k in value.inputs) {
            const i = externalIndicator.options?.[k];
            if (i == null) continue;
            i.value = value.inputs[k];
          }
        }

        extIndicators[value.pine_id] = study;
      }

      const curStudy = extIndicators[value.pine_id];
      input.value = `${curStudy.studID}$${value.pine_id ? value.plot_id.split('_')[1] : 0}`;

      continue;
    }

    if (!input) continue;
    input.value = value;
  }

  const study = new chart.Study(indicator);

  study.onUpdate(() => {
    client.end();
    return resolve(study);
  });

  study.onError(() => {
    client.end();
    return reject(Error('[TRADINGVIEW]: Study error'));
  });
});

module.exports = {
  alertToBacktest,
};
