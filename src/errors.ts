/** Machine-readable error categories raised by this library. */
export type TradingViewErrorCode =
  /** The server rejected a websocket packet and closed the connection. */
  | 'PROTOCOL_ERROR'
  /** The websocket could not be opened or failed. */
  | 'CONNECTION_ERROR'
  /** The websocket closed while an operation was still waiting for data. */
  | 'DISCONNECTED'
  /** Credentials were rejected or the account could not be loaded. */
  | 'AUTH_ERROR'
  /** `symbol_error`: the symbol could not be resolved. */
  | 'SYMBOL_ERROR'
  /** `series_error`: the series could not be loaded (permissions, timeframe...). */
  | 'SERIES_ERROR'
  /** `critical_error`: the server rejected a chart or replay command. */
  | 'CRITICAL_ERROR'
  /** `study_error`: an indicator failed on the server. */
  | 'STUDY_ERROR'
  /** A quote symbol returned an error status. */
  | 'QUOTE_ERROR'
  /** A strategy report or compressed payload could not be decoded. */
  | 'PARSE_ERROR'
  /** A method was called in a state where it cannot work. */
  | 'INVALID_STATE'
  /** An argument is invalid. */
  | 'INVALID_ARGUMENT'
  /** An HTTP endpoint answered with an unexpected status or payload. */
  | 'HTTP_ERROR'
  /** The requested resource does not exist or is not accessible. */
  | 'NOT_FOUND'
  /** The server answered but returned no usable data. */
  | 'NO_DATA'
  /** An operation did not complete in time. */
  | 'TIMEOUT'
  /** An operation was cancelled through an `AbortSignal`. */
  | 'ABORTED'
  /** A user-supplied callback threw while processing data. */
  | 'CALLBACK_ERROR';

export interface TradingViewErrorOptions {
  /** Raw details sent by the server, when available. */
  details?: unknown;
  cause?: unknown;
}

/** Every error produced by this library is a `TradingViewError`. */
export class TradingViewError extends Error {
  override readonly name = 'TradingViewError';

  readonly code: TradingViewErrorCode;

  /** Raw details sent by the server, when available. */
  readonly details: unknown;

  constructor(code: TradingViewErrorCode, message: string, options: TradingViewErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.code = code;
    this.details = options.details;
  }
}

/** Normalises any thrown value into a `TradingViewError`. */
export function toTradingViewError(
  error: unknown,
  fallbackCode: TradingViewErrorCode = 'CONNECTION_ERROR',
): TradingViewError {
  if (error instanceof TradingViewError) return error;
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new TradingViewError('ABORTED', error.message || 'Aborted', { cause: error });
    }
    return new TradingViewError(fallbackCode, error.message, { cause: error });
  }
  return new TradingViewError(fallbackCode, String(error), { details: error });
}
