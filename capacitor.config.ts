import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yakrof.app',
  appName: 'Yakro-Fê',
  webDir: 'public',
  server: {
    // Charge l'application déployée en production tout en exposant
    // les plugins natifs Capacitor (géolocalisation, push, etc.)
    url: 'https://yakrofe.com',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;

