import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auravision.app',
  appName: 'Aura Vision',
  webDir: 'build',
  server: {
    // Production backend URL for mobile app
    url: 'https://73613a20-b586-452b-8c47-65419969d01e.preview.emergentagent.com',
    cleartext: true
  },
  plugins: {
    Preferences: {
      group: 'AuraVisionApp'
    },
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
