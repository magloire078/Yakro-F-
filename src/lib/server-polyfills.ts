/**
 * Global polyfills for server-side rendering.
 * This file addresses issues where some libraries expect browser globals to exist on the server.
 */

export {};

if (typeof window === 'undefined') {
  // Polyfill for Buffer which is expected by some legacy dependencies (e.g. jwa, buffer-equal-constant-time)
  if (!global.Buffer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      global.Buffer = require('buffer').Buffer;
    } catch (e) {
      console.error('Failed to polyfill Buffer:', e);
    }
  }

  const storageMock: Storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  type GlobalWithStorage = typeof globalThis & { 
    localStorage?: Storage; 
    sessionStorage?: Storage; 
    Buffer?: typeof Buffer; 
  };

  (global as GlobalWithStorage).localStorage = storageMock;
  (global as GlobalWithStorage).sessionStorage = storageMock;
}
