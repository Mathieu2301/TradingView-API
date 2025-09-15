const { strategyToCsv } = require('../../main');

if (!process.env.SESSION || !process.env.SIGNATURE) throw Error('Please set your sessionid and signature cookies');

const studyId = 'STD;RSI%1Strategy';

const values = {
  pineFeatures: '{"strategy":1,"ta":1}',
  in_0: 7,
  in_1: 15,
  in_2: 95,
  in_3: 6,
  in_4: false,
  in_5: false,
  in_6: 0,
  in_7: 'percent_of_equity',
  in_8: 100,
  in_9: 100000,
  in_10: 'USDT',
  in_11: 3,
  in_12: 'percent',
  in_13: 0.05,
  in_14: false,
  in_15: 'FIFO',
  in_16: 100,
  in_17: 100,
  in_18: 2,
  in_19: false,
  in_20: false,
  in_21: 'BACKTEST',
  in_22: '',
  in_23: 'order_fills',
  in_24: '',
  in_25: true,
  in_26: '',
  __profile: false,
};

(async () => {
  const { csvData } = await strategyToCsv(studyId, values);
  console.log(csvData);
})();
