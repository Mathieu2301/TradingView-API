import { getScreener } from '@mathieuc/tradingview/data';

const page = await getScreener({
  market: 'america',
  columns: ['name', 'close', 'volume', 'Stoch.RSI.D'],
  filter: [{ left: 'type', operation: 'equal', right: 'stock' }],
  sort: { sortBy: 'volume', sortOrder: 'desc' },
  range: [0, 10],
});
console.table(page.rows.map(({ symbol, values }) => ({ symbol, ...values })));
