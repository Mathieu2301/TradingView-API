import { platform, arch, release } from 'node:os';

import { TradingViewError } from '../errors.js';
import {
  getSetCookies, request, type Credentials, type HttpOptions,
} from './request.js';

/** A TradingView account. */
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  reputation: number;
  following: number;
  followers: number;
  notifications: { user: number; following: number };
  /** `sessionid` cookie. Keep it secret. */
  session: string;
  /** `sessionid_sign` cookie. Keep it secret. */
  signature: string;
  sessionHash: string;
  privateChannel: string;
  /** Websocket auth token. Keep it secret. */
  authToken: string;
  joinDate: Date;
}

export interface LoginOptions extends HttpOptions {
  username: string;
  password: string;
  /** Keep the session alive longer. Default: true. */
  remember?: boolean;
  /** Custom user agent prefix. */
  userAgent?: string;
}

/**
 * Signs in with a username/email and password and returns the account with
 * its session cookies. Accounts with 2FA or captcha challenges are not supported.
 */
export async function loginUser(options: LoginOptions): Promise<User> {
  const remember = options.remember ?? true;
  const userAgent = options.userAgent ?? 'TWAPI/4.0';
  const { data, headers } = await request('https://www.tradingview.com/accounts/signin/', {
    method: 'POST',
    form: { username: options.username, password: options.password, remember: remember ? 'on' : undefined },
    headers: {
      referer: 'https://www.tradingview.com',
      'user-agent': `${userAgent} (${release()}; ${platform()}; ${arch()})`,
    },
  }, options);

  if (!data || typeof data !== 'object') {
    throw new TradingViewError('AUTH_ERROR', 'Unexpected sign-in response');
  }
  if (data.error) throw new TradingViewError('AUTH_ERROR', String(data.error), { details: data });
  if (!data.user) throw new TradingViewError('AUTH_ERROR', 'Sign-in response has no user', { details: data });

  const cookies = getSetCookies(headers);
  const cookie = (name: string) => {
    for (const line of cookies) {
      const match = new RegExp(`(?:^|[;\\s])${name}=([^;]*)`).exec(line);
      if (match) return match[1];
    }
    return '';
  };

  const { user } = data;
  return {
    id: Number(user.id),
    username: user.username,
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    reputation: Number(user.reputation ?? 0),
    following: Number(user.following ?? 0),
    followers: Number(user.followers ?? 0),
    notifications: {
      user: Number(user.notification_count?.user ?? 0),
      following: Number(user.notification_count?.following ?? 0),
    },
    session: cookie('sessionid'),
    signature: cookie('sessionid_sign'),
    sessionHash: user.session_hash ?? '',
    privateChannel: user.private_channel ?? '',
    authToken: user.auth_token ?? '',
    joinDate: new Date(user.date_joined),
  };
}

export interface GetUserOptions extends HttpOptions {
  /** Page used to read the account, for example `https://fr.tradingview.com/`. */
  location?: string;
  /** Maximum number of redirects to follow. Default: 5. */
  maxRedirects?: number;
}

function match(page: string, pattern: RegExp): string | undefined {
  return pattern.exec(page)?.[1];
}

function trustedAccountLocation(location: string): string {
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    throw new TradingViewError('AUTH_ERROR', 'Invalid account page URL');
  }
  if (url.protocol !== 'https:' || !/(^|\.)tradingview\.com$/i.test(url.hostname)) {
    throw new TradingViewError('AUTH_ERROR', 'Account page redirects outside TradingView');
  }
  return url.toString();
}

/** Parses the account embedded in a TradingView HTML page. */
export function parseUserPage(page: string, credentials: Credentials): User {
  return {
    id: Number(match(page, /"id":([0-9]{1,10}),/) ?? 0),
    username: match(page, /"username":"(.*?)"/) ?? '',
    firstName: match(page, /"first_name":"(.*?)"/) ?? '',
    lastName: match(page, /"last_name":"(.*?)"/) ?? '',
    reputation: parseFloat(match(page, /"reputation":(.*?),/) ?? '0') || 0,
    following: parseFloat(match(page, /,"following":([0-9]*?),/) ?? '0') || 0,
    followers: parseFloat(match(page, /,"followers":([0-9]*?),/) ?? '0') || 0,
    notifications: {
      following: parseFloat(match(page, /"notification_count":\{"following":([0-9]*),/) ?? '0') || 0,
      user: parseFloat(match(page, /"notification_count":\{"following":[0-9]*,"user":([0-9]*)/) ?? '0') || 0,
    },
    session: credentials.session,
    signature: credentials.signature ?? '',
    sessionHash: match(page, /"session_hash":"(.*?)"/) ?? '',
    privateChannel: match(page, /"private_channel":"(.*?)"/) ?? '',
    authToken: match(page, /"auth_token":"(.*?)"/) ?? '',
    joinDate: new Date(match(page, /"date_joined":"(.*?)"/) ?? 0),
  };
}

/** Loads the account behind `sessionid` (and `sessionid_sign`) cookies. */
export async function getUser(credentials: Credentials, options: GetUserOptions = {}): Promise<User> {
  if (!credentials?.session) throw new TradingViewError('INVALID_ARGUMENT', 'A session cookie is required');
  const maxRedirects = options.maxRedirects ?? 5;
  let location = trustedAccountLocation(options.location ?? 'https://www.tradingview.com/');

  for (let redirects = 0; ; redirects += 1) {
    const { text, headers } = await request(location, { credentials, redirect: 'manual' }, options);
    if (text.includes('auth_token')) return parseUserPage(text, credentials);

    const next = headers.get('location');
    const resolved = next ? new URL(next, location).toString() : undefined;
    if (!resolved || resolved === location) {
      throw new TradingViewError('AUTH_ERROR', 'Wrong or expired sessionid/signature');
    }
    if (redirects >= maxRedirects) {
      throw new TradingViewError('AUTH_ERROR', 'Too many redirects (possible WAF or geo-restriction)');
    }
    location = trustedAccountLocation(resolved);
  }
}
