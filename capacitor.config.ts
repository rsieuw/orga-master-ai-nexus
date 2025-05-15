/**
 * @fileoverview Capacitor configuration file for the OrgaMaster AI application.
 * This file defines the application ID, name, web directory, and plugin configurations,
 * such as SplashScreen settings and server settings for Android.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orgamasterai.app',
  appName: 'OrgaMaster AI',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#121212',
      androidSplashResourceName: 'splash_new',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
