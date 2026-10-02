import { TradingViewError, toTradingViewError } from '../errors.js';

/** TradingView account cookies. Keep them secret. */
export interface Credentials {
  /** Value of the `sessionid` cookie. */
  session: string;
  /** Value of the `sessionid_sign` cookie. */
  signature?: string;
}

/** Options accepted by every HTTP function. */
export interface HttpOptions {
  /** Custom `fetch` implementation (tests, proxies). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Cancels the request. */
  signal?: AbortSignal;
  /** Extra request headers. */
  headers?: Record<string, string>;
}

/** HTTP options for endpoints that can use an account. */
export interface AuthHttpOptions extends HttpOptions {
  credentials?: Credentials;
}

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Builds the `cookie` header value for credentials. */
export function authCookies(credentials?: Credentials | null): string {
  if (!credentials?.session) return '';
  if (!credentials.signature) return `sessionid=${credentials.session}`;
  return `sessionid=${credentials.session};sessionid_sign=${credentials.signature}`;
}

export interface RequestInit {
  method?: 'GET' | 'POST';
  query?: Record<string, string | number | boolean | undefined | null>;
  form?: Record<string, string | number | undefined | null>;
  json?: unknown;
  credentials?: Credentials | null;
  headers?: Record<string, string>;
  redirect?: 'follow' | 'manual';
}

export interface HttpResponse {
  status: number;
  headers: Headers;
  url: string;
  text: string;
  /** Parsed JSON body, or `undefined` when the body is not JSON. */
  data: any;
}

/** Performs a request. Like the historical client, 5xx statuses throw. */
export async function request(url: string, init: RequestInit, options: HttpOptions = {}): Promise<HttpResponse> {
  const target = new URL(url);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { ...options.headers, ...init.headers };
  const cookie = authCookies(init.credentials);
  if (cookie) headers.cookie = cookie;

  let body: string | undefined;
  if (init.form) {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(init.form)) {
      if (value !== undefined && value !== null) form.set(key, String(value));
    }
    body = form.toString();
    headers['content-type'] = 'application/x-www-form-urlencoded';
  } else if (init.json !== undefined) {
    body = JSON.stringify(init.json);
    headers['content-type'] = 'application/json';
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;
  let response: Response;
  try {
    response = await fetchImpl(target.toString(), {
      method: init.method ?? (body === undefined ? 'GET' : 'POST'),
      headers,
      body,
      redirect: init.redirect ?? 'follow',
      signal: options.signal,
    });
  } catch (error) {
    throw toTradingViewError(error, 'HTTP_ERROR');
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (response.status >= 500) {
    throw new TradingViewError('HTTP_ERROR', `${target.host} answered HTTP ${response.status}`, {
      details: { status: response.status, body: text.slice(0, 500) },
    });
  }

  return {
    status: response.status, headers: response.headers, url: target.toString(), text, data,
  };
}

/** Reads every `set-cookie` header, across runtimes. */
export function getSetCookies(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetter.getSetCookie === 'function') return withGetter.getSetCookie();
  const raw = headers.get('set-cookie');
  return raw ? raw.split(/,(?=\s*[^;,=\s]+=)/) : [];
}
