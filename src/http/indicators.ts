import { TradingViewError } from '../errors.js';
import { PineIndicator, type PineInput } from '../indicators/pine-indicator.js';
import {
  request, type AuthHttpOptions, type Credentials, type HttpOptions,
} from './request.js';

export type IndicatorAccess = 'open_source' | 'closed_source' | 'invite_only' | 'private' | 'other';

/** An indicator returned by `searchIndicators` or `getPrivateIndicators`. */
export interface IndicatorSearchResult {
  /** Script ID to pass to `getIndicator`. */
  id: string;
  version: string;
  name: string;
  author: { id: number; username: string };
  /** Chart image ID: `https://www.tradingview.com/i/<image>`. */
  image: string;
  /** Pine source, when public. */
  source: string;
  type: 'study' | 'strategy' | (string & {});
  access: IndicatorAccess;
}

let builtInCache: Promise<any[]> | undefined;

async function loadBuiltIns(options: HttpOptions): Promise<any[]> {
  const lists = await Promise.all(['standard', 'candlestick', 'fundamental'].map(async (filter) => {
    const { data } = await request('https://pine-facade.tradingview.com/pine-facade/list', { query: { filter } }, options);
    return Array.isArray(data) ? data : [];
  }));
  return lists.flat();
}

/** Clears the in-memory list of built-in indicators used by `searchIndicators`. */
export function clearIndicatorCache(): void {
  builtInCache = undefined;
}

const normalise = (value = '') => value.toUpperCase().replace(/[^A-Z]/g, '');

/** Searches built-in and community indicators. */
export async function searchIndicators(query = '', options: HttpOptions = {}): Promise<IndicatorSearchResult[]> {
  // Custom fetch implementations (tests, proxies) must not share the process-wide cache.
  const builtInsPromise = options.fetch ? loadBuiltIns(options) : (builtInCache ??= loadBuiltIns(options));
  const [builtIns, community] = await Promise.all([
    builtInsPromise.catch((error) => {
      if (!options.fetch) builtInCache = undefined;
      throw error;
    }),
    request('https://www.tradingview.com/pubscripts-suggest-json', { query: { search: query } }, options),
  ]);

  const needle = normalise(query);
  const kind = (ind: any) => ind.extra?.kind ?? 'study';

  return [
    ...builtIns
      .filter((ind) => normalise(ind.scriptName).includes(needle)
        || normalise(ind.extra?.shortDescription).includes(needle))
      .map((ind): IndicatorSearchResult => ({
        id: ind.scriptIdPart,
        version: String(ind.version),
        name: ind.scriptName,
        author: { id: Number(ind.userId ?? -1), username: '@TRADINGVIEW@' },
        image: '',
        source: '',
        type: kind(ind),
        access: 'closed_source',
      })),
    ...(community.data?.results ?? []).map((ind: any): IndicatorSearchResult => ({
      id: ind.scriptIdPart,
      version: String(ind.version),
      name: ind.scriptName,
      author: { id: Number(ind.author?.id ?? -1), username: ind.author?.username ?? '' },
      image: ind.imageUrl ?? '',
      source: ind.scriptSource ?? '',
      type: kind(ind),
      access: (['open_source', 'closed_source', 'invite_only'] as const)[ind.access - 1] ?? 'other',
    })),
  ];
}

export interface GetIndicatorOptions extends AuthHttpOptions {
  /** Script version. Default: `last`. */
  version?: string;
}

const sanitise = (value: string) => value.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');

function parseInputs(items: any[]): Record<string, PineInput> {
  const inputs: Record<string, PineInput> = {};
  for (const input of items) {
    if (['text', 'pineId', 'pineVersion'].includes(input.id)) continue;
    const inlineName = sanitise(String(input.name ?? input.id));
    inputs[input.id] = {
      name: input.name,
      inline: input.inline || inlineName,
      internalID: input.internalID || inlineName,
      tooltip: input.tooltip,
      type: input.type,
      value: input.defval,
      isHidden: !!input.isHidden,
      isFake: !!input.isFake,
      ...(input.options ? { options: input.options } : {}),
    };
  }
  return inputs;
}

function parsePlots(styles: Record<string, any>, items: any[]): Record<string, string> {
  const plots: Record<string, string> = {};
  for (const [plotId, style] of Object.entries(styles)) {
    const title = sanitise(String(style.title ?? plotId));
    const titles = Object.values(plots);
    if (titles.includes(title)) {
      let i = 2;
      while (titles.includes(`${title}_${i}`)) i += 1;
      plots[plotId] = `${title}_${i}`;
    } else plots[plotId] = title;
  }
  for (const plot of items) {
    if (!plot.target) continue;
    plots[plot.id] = `${plots[plot.target] ?? plot.target}_${plot.type}`;
  }
  return plots;
}

const COMPILED_SCRIPT_PREFIX = 'bmI9Ks46_';

const compiledScriptOrUndefined = (value: unknown): string | undefined => (
  typeof value === 'string' && value.startsWith(COMPILED_SCRIPT_PREFIX) ? value : undefined
);

/**
 * The compiled script (`ILScript`) of a `pine-facade/translate` result.
 *
 * TradingView moved it twice in October 2026: `result.ilTemplate` (historical),
 * then the `defval` of the hidden `text` input (27 Oct), then
 * `metaInfo.defaults.inputs.text` (by 30 Oct). All three are read, newest
 * shape last, so a rollback on their side keeps working too. Without it the
 * chart server answers `study_error` "Can't parse pine".
 */
export function compiledScriptOf(result: any): string | undefined {
  if (typeof result?.ilTemplate === 'string' && result.ilTemplate) return result.ilTemplate;
  const meta = result?.metaInfo;
  const textInput = Array.isArray(meta?.inputs)
    ? meta.inputs.find((input: any) => input?.id === 'text')
    : undefined;
  return compiledScriptOrUndefined(textInput?.defval)
    ?? compiledScriptOrUndefined(meta?.defaults?.inputs?.text);
}

/** Converts a `pine-facade/translate` result into a `PineIndicator`. */
export function parseIndicatorDefinition(result: any, id: string, version: string): PineIndicator {
  const meta = result.metaInfo;
  return new PineIndicator({
    id: meta.scriptIdPart || id,
    version: meta.pine?.version || version,
    description: meta.description,
    shortDescription: meta.shortDescription,
    inputs: parseInputs(meta.inputs),
    plots: parsePlots(meta.styles ?? {}, meta.plots ?? []),
    script: compiledScriptOf(result) ?? '',
  });
}

/**
 * Loads an indicator definition (`STD;RSI`, `PUB;xxxx`, `USER;xxxx`...).
 * Private and invite-only scripts need credentials with access.
 */
export async function getIndicator(id: string, options: GetIndicatorOptions = {}): Promise<PineIndicator> {
  const version = options.version ?? 'last';
  const encodedId = id.replace(/ |%/g, '%25');
  const { data } = await request(
    `https://pine-facade.tradingview.com/pine-facade/translate/${encodedId}/${version}`,
    { credentials: options.credentials },
    options,
  );

  if (!data?.success || !data.result?.metaInfo?.inputs) {
    throw new TradingViewError('NOT_FOUND', `Inexistent or unsupported indicator: "${data?.reason}"`, { details: data });
  }
  if (!compiledScriptOf(data.result)) {
    throw new TradingViewError(
      'PARSE_ERROR',
      `No compiled script in the definition of "${id}": TradingView changed the pine-facade/translate format again`,
      { details: data },
    );
  }
  return parseIndicatorDefinition(data.result, encodedId, version);
}

/** Lists the private (saved) indicators of an account. */
export async function getPrivateIndicators(
  credentials: Credentials,
  options: HttpOptions = {},
): Promise<IndicatorSearchResult[]> {
  const { data } = await request('https://pine-facade.tradingview.com/pine-facade/list', {
    query: { filter: 'saved' },
    credentials,
  }, options);

  if (!Array.isArray(data)) {
    throw new TradingViewError('AUTH_ERROR', 'Unable to list private indicators (check credentials)', { details: data });
  }

  return data.map((ind: any): IndicatorSearchResult => ({
    id: ind.scriptIdPart,
    version: String(ind.version),
    name: ind.scriptName,
    author: { id: -1, username: '@ME@' },
    image: ind.imageUrl ?? '',
    source: ind.scriptSource ?? '',
    type: ind.extra?.kind ?? 'study',
    access: 'private',
  }));
}
