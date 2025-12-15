import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dev.rk',
  appName: 'RK',
  webDir: 'public', // doesn't matter now
  server: {
    url: 'https://rk-alpha-nine.vercel.app', // YOUR LIVE NEXT.JS APP
    cleartext: true
  }
};

export default config;
