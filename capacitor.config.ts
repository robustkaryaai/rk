import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dev.rk',
  appName: 'RK',
  webDir: 'public',
  server: {
    url: process.env.CAP_SERVER_URL || 'https://rk-alpha-nine.vercel.app',
    cleartext: true
  }
};

export default config;
