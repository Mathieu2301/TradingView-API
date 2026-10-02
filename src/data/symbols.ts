import type { SymbolInfo, TradingSession } from '../chart/types.js';
import { runOperation, validateSymbol, type OperationOptions } from './operation.js';

export interface SymbolInfoQuery extends OperationOptions {
  symbol: string;
  session?: TradingSession;
  currency?: string;
}

/** Resolves a symbol: exchange, currency, session, price scale, type... */
export function getSymbolInfo(query: SymbolInfoQuery | string): Promise<SymbolInfo> {
  const options: SymbolInfoQuery = typeof query === 'string' ? { symbol: query } : query;
  let symbol: string;
  try {
    symbol = validateSymbol(options.symbol);
  } catch (error) {
    return Promise.reject(error);
  }

  return runOperation<SymbolInfo>(options, `getSymbolInfo(${symbol})`, ({ client, resolve, reject }) => {
    const chart = client.createChart();
    chart.on('error', reject);
    chart.on('symbolLoaded', resolve);
    chart.setMarket(symbol, { count: 1, session: options.session, currency: options.currency });
    return () => chart.delete();
  });
}
