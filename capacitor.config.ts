import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dev.rk',
  appName: 'RK',
  webDir: 'public',
  server: {
    url: process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000',
    cleartext: true
  }
};

export default config;
