import type { FirestorePermissionError } from './errors';
import type { FirestoreError } from 'firebase/firestore';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
  'firestore-error': (error: FirestoreError, context: { path: string; operation: string }) => void;
};

// We can't use the native EventEmitter because it's not available in the browser
// This is a simple implementation that will work for our case.
class BrowserEventEmitter {
    private listeners: { [K in keyof AppEvents]?: AppEvents[K][] } = {};

    on<E extends keyof AppEvents>(event: E, listener: AppEvents[E]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    emit<E extends keyof AppEvents>(event: E, ...args: Parameters<AppEvents[E]>): void {
        const listeners = this.listeners[event];
        if (listeners) {
            (listeners as Array<(...args: unknown[]) => void>).forEach(listener => {
                (listener as (...args: Parameters<AppEvents[E]>) => void)(...args);
            });
        }
    }
}


export const errorEmitter = new BrowserEventEmitter();
