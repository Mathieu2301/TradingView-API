/** A value with absolute and percent forms. */
export interface RelAbsValue {
  v: number;
  p: number;
}

export interface TradeReport {
  entry: { name: string; type: 'long' | 'short'; value: number; time: number };
  /** `name` is '' for exits that are not explicit. */
  exit: { name: string; value: number; time: number };
  quantity: number;
  profit: RelAbsValue;
  cumulative: RelAbsValue;
  runup: RelAbsValue;
  drawdown: RelAbsValue;
}

export interface PerformanceReport {
  avgBarsInTrade: number;
  avgBarsInWinTrade: number;
  avgBarsInLossTrade: number;
  avgTrade: number;
  avgTradePercent: number;
  avgLosTrade: number;
  avgLosTradePercent: number;
  avgWinTrade: number;
  avgWinTradePercent: number;
  commissionPaid: number;
  grossLoss: number;
  grossLossPercent: number;
  grossProfit: number;
  grossProfitPercent: number;
  largestLosTrade: number;
  largestLosTradePercent: number;
  largestWinTrade: number;
  largestWinTradePercent: number;
  marginCalls: number;
  maxContractsHeld: number;
  netProfit: number;
  netProfitPercent: number;
  numberOfLosingTrades: number;
  numberOfWiningTrades: number;
  percentProfitable: number;
  profitFactor: number;
  ratioAvgWinAvgLoss: number;
  totalOpenTrades: number;
  totalTrades: number;
  [key: string]: number;
}

export interface FromTo {
  from: number;
  to: number;
}

/** Report sent by Pine strategies (backtest results computed by TradingView). */
export interface StrategyReport {
  currency?: string;
  settings?: { dateRange?: { backtest?: FromTo; trade?: FromTo }; [key: string]: unknown };
  /** Trades, most recent first. */
  trades: TradeReport[];
  history: {
    buyHold?: number[];
    buyHoldPercent?: number[];
    drawDown?: number[];
    drawDownPercent?: number[];
    equity?: number[];
    equityPercent?: number[];
  };
  performance: {
    all?: PerformanceReport;
    long?: PerformanceReport;
    short?: PerformanceReport;
    buyHoldReturn?: number;
    buyHoldReturnPercent?: number;
    maxDrawDown?: number;
    maxDrawDownPercent?: number;
    openPL?: number;
    openPLPercent?: number;
    sharpeRatio?: number;
    sortinoRatio?: number;
    [key: string]: unknown;
  };
}

export type StrategyReportChange =
  | 'report.currency' | 'report.settings' | 'report.perf' | 'report.trades' | 'report.history';

/** Converts raw trades (oldest first) into readable trades (most recent first). */
export function parseTrades(trades: any[]): TradeReport[] {
  return [...trades].reverse().map((t) => ({
    entry: {
      name: t.e?.c,
      type: String(t.e?.tp ?? '').startsWith('s') ? 'short' : 'long',
      value: t.e?.p,
      time: t.e?.tm,
    },
    exit: { name: t.x?.c, value: t.x?.p, time: t.x?.tm },
    quantity: t.q,
    profit: t.tp,
    cumulative: t.cp,
    runup: t.rn,
    drawdown: t.dd,
  }));
}

/** Merges a raw report into `target`; returns the changed parts. */
export function mergeStrategyReport(target: StrategyReport, report: any): StrategyReportChange[] {
  const changes: StrategyReportChange[] = [];
  if (!report || typeof report !== 'object') return changes;

  if (report.currency) {
    target.currency = report.currency;
    changes.push('report.currency');
  }
  if (report.settings) {
    target.settings = report.settings;
    changes.push('report.settings');
  }
  if (report.performance) {
    target.performance = report.performance;
    changes.push('report.perf');
  }
  if (report.trades) {
    target.trades = parseTrades(report.trades);
    changes.push('report.trades');
  }
  if (report.equity) {
    target.history = {
      buyHold: report.buyHold,
      buyHoldPercent: report.buyHoldPercent,
      drawDown: report.drawDown,
      drawDownPercent: report.drawDownPercent,
      equity: report.equity,
      equityPercent: report.equityPercent,
    };
    changes.push('report.history');
  }
  return changes;
}
