import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auravision.app',
  appName: 'Aura Vision',
  webDir: 'build',
  server: {
    // Production backend URL for mobile app
    url: 'https://64fd6267-0033-41b0-9cf5-16f4e283c680.preview.emergentagent.com',
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
