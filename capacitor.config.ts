import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streamzone.app',
  appName: 'StreamZone',
  webDir: 'out',
  server: {
    url: 'https://streamzonesports.vercel.app',
    cleartext: false
  }
};

export default config;
