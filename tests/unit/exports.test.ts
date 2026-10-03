import { describe, expect, it } from 'vitest';
import * as root from '../../src/index.js';
import * as data from '../../src/data/index.js';

describe('public API', () => {
  it('root entry exposes the high-level, low-level and HTTP APIs', () => {
    expect(Object.keys(root).sort()).toEqual([
      'ALL_QUOTE_FIELDS', 'BuiltInIndicator', 'CHART_TYPE_STUDIES', 'ChartSession', 'DEFAULT_TIMEOUT_MS', 'Emitter',
      'PineIndicator', 'PinePermissionManager', 'QuoteSession', 'QuoteSubscription', 'Study', 'TradingViewClient',
      'TradingViewError', 'TradingViewProvider', 'applyGraphicsCommands', 'clearIndicatorCache', 'getCandles', 'getChartToken', 'getDrawings',
      'getIndicator', 'getIndicatorData', 'getPrivateIndicators', 'getQuote', 'getQuotes', 'getScreener', 'getSymbolInfo',
      'getTechnicalAnalysis', 'getUser', 'loginUser', 'mergeStrategyReport', 'parseGraphics', 'parseIndicatorDefinition',
      'parseTrades', 'protocol', 'quoteSymbolKey', 'resolveQuoteFields', 'searchIndicators', 'searchMarkets', 'summarizeStrategyReport',
      'timeframeSeconds', 'toTradingViewError', 'watchCandles', 'watchIndicator', 'watchQuotes', 'wsTransport',
    ]);
    expect(Object.keys(root.protocol).sort()).toEqual([
      'createSessionId', 'decodeCompressed', 'decodeFrames', 'encodeFrame', 'encodeHeartbeat', 'encodePacket',
      'normaliseBase64', 'readFirstZipEntry',
    ]);
  });

  it('data entry only exposes the simplified data API', () => {
    expect(Object.keys(data).sort()).toEqual([
      'DEFAULT_TIMEOUT_MS', 'TradingViewError', 'TradingViewProvider', 'getCandles', 'getIndicatorData', 'getQuote', 'getQuotes', 'getScreener', 'getSymbolInfo',
      'getTechnicalAnalysis', 'searchIndicators', 'searchMarkets', 'summarizeStrategyReport', 'watchCandles', 'watchIndicator', 'watchQuotes',
    ]);
    expect(data.getCandles).toBe(root.getCandles);
  });
});
