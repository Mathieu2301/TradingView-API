const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Creates a random session or request ID such as `cs_Ab12Cd34Ef56`. */
export function createSessionId(prefix = 'xs'): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  let id = '';
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return `${prefix}_${id}`;
}
