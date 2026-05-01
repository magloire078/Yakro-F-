/**
 * Global polyfills for server-side rendering.
 * This file addresses issues where some libraries expect browser globals to exist on the server.
 */

export {};

if (typeof window === 'undefined') {
  const storageMock: Storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  (global as typeof globalThis & { localStorage?: Storage; sessionStorage?: Storage }).localStorage = storageMock;
  (global as typeof globalThis & { localStorage?: Storage; sessionStorage?: Storage }).sessionStorage = storageMock;
  
}
