import { TradingViewError } from '../errors.js';
import { request, type Credentials, type HttpOptions } from './request.js';

/** A user allowed to use an invite-only script. */
export interface AuthorizedUser {
  id: number;
  username: string;
  userpic: string;
  /** ISO date, or null when the access does not expire. */
  expiration: string | null;
  created: string;
  [key: string]: unknown;
}

export type AuthorizedUserOrder =
  | 'user__username' | '-user__username'
  | 'created' | '-created'
  | 'expiration,user__username' | '-expiration,user__username';

export interface PinePermissionOptions extends HttpOptions {
  credentials: Credentials;
}

/** Manages who can use an invite-only Pine script you own. */
export class PinePermissionManager {
  readonly pineId: string;

  readonly #credentials: Credentials;

  readonly #options: HttpOptions;

  constructor(pineId: string, options: PinePermissionOptions) {
    if (!pineId) throw new TradingViewError('INVALID_ARGUMENT', 'A Pine ID is required');
    if (!options?.credentials?.session) throw new TradingViewError('INVALID_ARGUMENT', 'A session cookie is required');
    if (!options.credentials.signature) throw new TradingViewError('INVALID_ARGUMENT', 'A session signature is required');
    this.pineId = pineId;
    this.#credentials = options.credentials;
    this.#options = { fetch: options.fetch, signal: options.signal, headers: options.headers };
  }

  async #post(path: string, form: Record<string, string | undefined>, query?: Record<string, string | number>) {
    const { status, data } = await request(`https://www.tradingview.com/pine_perm/${path}`, {
      method: 'POST',
      query,
      form: { pine_id: this.pineId, ...form },
      credentials: this.#credentials,
      headers: { origin: 'https://www.tradingview.com' },
    }, this.#options);

    if (status >= 400) {
      throw new TradingViewError(status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR', data?.detail ?? 'Wrong credentials or pineId', {
        details: data,
      });
    }
    return data;
  }

  /** Lists authorized users. */
  async getUsers(limit = 10, order: AuthorizedUserOrder = '-created'): Promise<AuthorizedUser[]> {
    const data = await this.#post('list_users/', {}, { limit, order_by: order });
    return data?.results ?? [];
  }

  /** Authorizes a user, optionally until a date. */
  async addUser(username: string, expiration?: Date): Promise<'ok' | 'exists' | (string & {})> {
    const data = await this.#post('add/', { username_recip: username, expiration: expiration?.toISOString() });
    return data?.status;
  }

  /** Changes (or removes, without date) the expiration of a user's access. */
  async modifyExpiration(username: string, expiration?: Date): Promise<'ok' | (string & {})> {
    const data = await this.#post('modify_user_expiration/', {
      username_recip: username, expiration: expiration?.toISOString(),
    });
    return data?.status;
  }

  /** Revokes a user's access. */
  async removeUser(username: string): Promise<'ok' | (string & {})> {
    const data = await this.#post('remove/', { username_recip: username });
    return data?.status;
  }
}
