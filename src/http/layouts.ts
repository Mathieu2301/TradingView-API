import { TradingViewError } from '../errors.js';
import { request, type AuthHttpOptions } from './request.js';

export interface LayoutOptions extends AuthHttpOptions {
  /** Account ID (`User.id`), required with credentials for private layouts. */
  userId?: number;
}

/** Gets a chart-storage token for a layout (the ID in `tradingview.com/chart/<ID>/`). */
export async function getChartToken(layoutId: string, options: LayoutOptions = {}): Promise<string> {
  const authenticated = Boolean(options.credentials?.session && options.userId);
  const { data } = await request('https://www.tradingview.com/chart-token', {
    query: { image_url: layoutId, user_id: authenticated ? options.userId : -1 },
    credentials: authenticated ? options.credentials : undefined,
  }, options);

  if (!data?.token) throw new TradingViewError('NOT_FOUND', 'Wrong layout or credentials', { details: data });
  return data.token;
}

export interface DrawingPoint {
  time_t: number;
  price: number;
  offset: number;
  [key: string]: unknown;
}

/** A user drawing stored in a layout. State properties are merged at the top level. */
export interface Drawing {
  id: string;
  symbol: string;
  ownerSource: string;
  serverUpdateTime: string;
  currencyId: string;
  unitId: unknown;
  type: string;
  points: DrawingPoint[];
  zorder: number;
  linkKey: string;
  state: Record<string, any>;
  [key: string]: unknown;
}

export interface GetDrawingsOptions extends LayoutOptions {
  /** Only returns drawings for this symbol. */
  symbol?: string;
  /** Chart ID inside the layout. Default: `_shared`. */
  chartId?: string;
}

/** Lists the drawings of a layout. */
export async function getDrawings(layoutId: string, options: GetDrawingsOptions = {}): Promise<Drawing[]> {
  const token = await getChartToken(layoutId, options);
  const { data } = await request(`https://charts-storage.tradingview.com/charts-storage/get/layout/${layoutId}/sources`, {
    query: { chart_id: options.chartId ?? '_shared', jwt: token, symbol: options.symbol ?? '' },
  }, options);

  if (!data?.payload) {
    throw new TradingViewError('NOT_FOUND', 'Wrong layout, user credentials, or chart id', { details: data });
  }
  return Object.values<any>(data.payload.sources ?? {}).map((drawing) => ({ ...drawing, ...drawing.state }));
}
