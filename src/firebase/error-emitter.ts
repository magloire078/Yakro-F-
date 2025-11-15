
import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We can't use the native EventEmitter because it's not available in the browser
// This is a simple implementation that will work for our case.
class BrowserEventEmitter {
    private listeners: { [key: string]: Function[] } = {};

    on<E extends keyof AppEvents>(event: E, listener: AppEvents[E]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    emit<E extends keyof AppEvents>(event: E, ...args: Parameters<AppEvents[E]>): void {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
}


export const errorEmitter = new BrowserEventEmitter();
