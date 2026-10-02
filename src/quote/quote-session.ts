import type { TradingViewClient } from '../client/client.js';
import { TradingViewError } from '../errors.js';
import { Emitter } from '../events.js';
import type { TradingSession } from '../chart/types.js';
import type { ServerPacket } from '../protocol/framing.js';
import { createSessionId } from '../protocol/ids.js';
import {
  resolveQuoteFields, type QuoteData, type QuoteField, type QuoteFieldPreset,
} from './fields.js';

export interface QuoteSessionOptions {
  /** `all` (default), `price`, or an explicit list of fields. */
  fields?: QuoteFieldPreset | readonly QuoteField[];
}

export interface QuoteSubscriptionOptions {
  /** Trading session. Default: `regular`. */
  session?: TradingSession;
}

export interface QuoteSubscriptionEvents {
  [event: string]: unknown[];
  /** Initial values were received. */
  loaded: [];
  /** New values. `quote` is the merged snapshot, `changes` only the new fields. */
  data: [quote: QuoteData, changes: QuoteData];
  error: [error: TradingViewError];
}

export interface QuoteSessionEvents {
  [event: string]: unknown[];
  error: [error: TradingViewError];
}

/** Key identifying a symbol + session in quote packets. */
export function quoteSymbolKey(symbol: string, session: TradingSession = 'regular'): string {
  return `=${JSON.stringify({ session, symbol })}`;
}

/** Live quotes for one symbol. Create it with `quoteSession.subscribe()`. */
export class QuoteSubscription extends Emitter<QuoteSubscriptionEvents> {
  readonly symbol: string;

  readonly session: TradingSession;

  /** @internal */
  readonly key: string;

  readonly #onClose: (subscription: QuoteSubscription) => void;

  #data: QuoteData = {};

  #loaded = false;

  #closed = false;

  /** @internal Use `quoteSession.subscribe()`. */
  constructor(symbol: string, session: TradingSession, onClose: (subscription: QuoteSubscription) => void) {
    super();
    this.symbol = symbol;
    this.session = session;
    this.key = quoteSymbolKey(symbol, session);
    this.#onClose = onClose;
  }

  /** Latest merged values. */
  get data(): QuoteData {
    return { ...this.#data };
  }

  /** True after the initial values were received. */
  get isLoaded(): boolean {
    return this.#loaded;
  }

  get isClosed(): boolean {
    return this.#closed;
  }

  /** Stops receiving quotes for this subscription. Idempotent. */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#onClose(this);
  }

  /** @internal Copies the state of a loaded subscription to the same symbol. */
  seed(source: QuoteSubscription): void {
    if (!source.isLoaded) return;
    queueMicrotask(() => {
      if (this.#closed || this.#loaded) return;
      this.#data = source.data;
      this.#loaded = true;
      this.emit('data', this.data, this.data);
      this.emit('loaded');
    });
  }

  /** @internal */
  handlePacket(packet: ServerPacket): void {
    if (this.#closed) return;
    if (packet.m === 'quote_completed') {
      this.#loaded = true;
      this.emit('loaded');
      return;
    }
    const payload = packet.p[1] as { s?: string; v?: QuoteData; errmsg?: string };
    if (payload?.s === 'ok') {
      const changes = { ...payload.v };
      this.#data = { ...this.#data, ...changes };
      this.emit('data', this.data, changes);
    } else if (payload?.s === 'error') {
      this.emit('error', new TradingViewError('QUOTE_ERROR', `Quote error (${this.symbol}): ${payload.errmsg ?? 'unknown'}`, {
        details: packet.p,
      }));
    }
  }

  /** @internal */
  handleClose(error: TradingViewError, expected: boolean): void {
    if (this.#closed) return;
    this.#closed = true;
    if (!expected) this.emit('error', error);
  }
}

/**
 * A set of live quote subscriptions sharing the same fields.
 * Create it with `client.createQuoteSession()`.
 */
export class QuoteSession extends Emitter<QuoteSessionEvents> {
  readonly id = createSessionId('qs');

  readonly client: TradingViewClient;

  readonly #subscriptions = new Map<string, Set<QuoteSubscription>>();

  #fields: QuoteField[];

  #deleted = false;

  constructor(client: TradingViewClient, options: QuoteSessionOptions = {}) {
    super();
    this.client = client;
    this.#fields = resolveQuoteFields(options.fields);
    client.registerSession(this.id, {
      onPacket: (packet) => this.#onPacket(packet),
      onClose: (error, expected) => this.#onClientClose(error, expected),
    });
    client.send('quote_create_session', [this.id]);
    client.send('quote_set_fields', [this.id, ...this.#fields]);
  }

  /** Requested fields. */
  get fields(): readonly QuoteField[] {
    return this.#fields;
  }

  get isDeleted(): boolean {
    return this.#deleted;
  }

  /** Changes the requested fields for every subscription. */
  setFields(fields: QuoteFieldPreset | readonly QuoteField[]): void {
    this.#assertAlive();
    this.#fields = resolveQuoteFields(fields);
    this.client.send('quote_set_fields', [this.id, ...this.#fields]);
  }

  /**
   * Subscribes to a symbol. Several subscriptions to the same symbol share
   * one server subscription.
   */
  subscribe(symbol: string, options: QuoteSubscriptionOptions = {}): QuoteSubscription {
    this.#assertAlive();
    if (!symbol) throw new TradingViewError('INVALID_ARGUMENT', 'A symbol is required');
    const subscription = new QuoteSubscription(symbol, options.session ?? 'regular', (sub) => this.#release(sub));
    let set = this.#subscriptions.get(subscription.key);
    if (!set) {
      set = new Set();
      this.#subscriptions.set(subscription.key, set);
      this.client.send('quote_add_symbols', [this.id, subscription.key]);
    } else {
      const loaded = [...set].find((sub) => sub.isLoaded);
      if (loaded) subscription.seed(loaded);
    }
    set.add(subscription);
    return subscription;
  }

  /** Deletes the session and all its subscriptions. Idempotent. */
  delete(): void {
    if (this.#deleted) return;
    this.#deleted = true;
    if (!this.client.isClosed) this.client.send('quote_delete_session', [this.id]);
    this.client.unregisterSession(this.id);
    for (const set of this.#subscriptions.values()) for (const sub of set) sub.close();
    this.#subscriptions.clear();
  }

  #release(subscription: QuoteSubscription): void {
    const set = this.#subscriptions.get(subscription.key);
    if (!set?.delete(subscription)) return;
    if (set.size === 0) {
      this.#subscriptions.delete(subscription.key);
      if (!this.#deleted && !this.client.isClosed) {
        this.client.send('quote_remove_symbols', [this.id, subscription.key]);
      }
    }
  }

  #assertAlive(): void {
    if (this.#deleted) throw new TradingViewError('INVALID_STATE', 'The quote session is deleted');
  }

  #onClientClose(error: TradingViewError, expected: boolean): void {
    if (this.#deleted) return;
    this.#deleted = true;
    if (!expected) this.emit('error', error);
    for (const set of this.#subscriptions.values()) for (const sub of set) sub.handleClose(error, expected);
    this.#subscriptions.clear();
  }

  #onPacket(packet: ServerPacket): void {
    this.client.log('quote', this.id, packet);
    let key: string | undefined;
    if (packet.m === 'quote_completed') key = String(packet.p[1]);
    else if (packet.m === 'qsd') key = (packet.p[1] as { n?: string })?.n;
    else return;
    if (key === undefined) return;

    const set = this.#subscriptions.get(key);
    if (!set) {
      // Data for a symbol nobody listens to anymore.
      if (!this.#deleted && !this.client.isClosed) this.client.send('quote_remove_symbols', [this.id, key]);
      return;
    }
    for (const sub of [...set]) sub.handlePacket(packet);
  }
}
