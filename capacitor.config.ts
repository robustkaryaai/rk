import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dev.rk',
  appName: 'RK',
  webDir: 'out',
  server: {
    url: process.env.CAP_SERVER_URL,
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
