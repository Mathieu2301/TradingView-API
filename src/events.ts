type EventMap = { [event: string]: unknown[] };

export type Listener<Args extends unknown[]> = (...args: Args) => void;

/** Unsubscribes the listener it was returned for. */
export type Unsubscribe = () => void;

/** Catch-all listener: receives the event name, then the event arguments. */
export type AnyListener<Events extends EventMap> = (
  ...args: { [K in keyof Events & string]: [event: K, ...args: Events[K]] }[keyof Events & string]
) => void;

/**
 * Small typed event emitter shared by clients, sessions and studies.
 *
 * Listener exceptions are reported without interrupting other listeners or
 * crashing the host process. An `error` event without any
 * listener is written to `console.error` instead of being silently dropped.
 */
export class Emitter<Events extends EventMap> {
  readonly #listeners = new Map<keyof Events, Set<Listener<any>>>();

  readonly #anyListeners = new Set<AnyListener<Events>>();

  /** Adds a listener and returns a function that removes it. */
  on<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.#listeners.get(event);
    if (!set) {
      set = new Set();
      this.#listeners.set(event, set);
    }
    set.add(listener);
    return () => this.off(event, listener);
  }

  /** Adds a listener called at most once. */
  once<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    const wrapper: Listener<Events[K]> = (...args) => {
      this.off(event, wrapper);
      return listener(...args);
    };
    return this.on(event, wrapper);
  }

  /** Removes a listener. */
  off<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): void {
    this.#listeners.get(event)?.delete(listener);
  }

  /** Listens to every event; receives the event name first. */
  onAny(listener: AnyListener<Events>): Unsubscribe {
    this.#anyListeners.add(listener);
    return () => { this.#anyListeners.delete(listener); };
  }

  /** Number of listeners for an event (catch-all listeners excluded). */
  listenerCount(event: keyof Events & string): number {
    return this.#listeners.get(event)?.size ?? 0;
  }

  /** True when the event has a listener, including catch-all listeners. */
  protected hasListeners(event: keyof Events & string): boolean {
    return this.listenerCount(event) > 0 || this.#anyListeners.size > 0;
  }

  /** Removes every listener. */
  protected removeAllListeners(): void {
    this.#listeners.clear();
    this.#anyListeners.clear();
  }

  protected emit<K extends keyof Events & string>(event: K, ...args: Events[K]): void {
    const set = this.#listeners.get(event);
    if (event === 'error' && !set?.size && !this.#anyListeners.size) {
      console.error('[tradingview]', ...args);
      return;
    }
    for (const listener of [...(set ?? [])]) Emitter.#call(() => listener(...args));
    for (const listener of [...this.#anyListeners]) Emitter.#call(() => (listener as (...a: unknown[]) => unknown)(event, ...args));
  }

  static #call(fn: () => unknown): void {
    try {
      const result = fn();
      if (result && typeof result === 'object' && 'then' in result) {
        Promise.resolve(result).catch((error) => {
          console.error('[tradingview] Listener threw:', error);
        });
      }
    } catch (error) {
      console.error('[tradingview] Listener threw:', error);
    }
  }
}
