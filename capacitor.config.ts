/**
 * @fileoverview Capacitor configuration file for the OrgaMaster AI application.
 * This file defines the application ID, name, web directory, and plugin configurations,
 * such as server settings for Android.
 * 
 * Note: Splash screen functionality via Capacitor is now fully disabled, using only
 * the native Android 12+ splash screen API instead.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orgamasterai.app',
  appName: 'OrgaMaster AI',
  webDir: 'dist',
  plugins: {
    // SplashScreen opties zijn volledig verwijderd om dubbele splash screens te voorkomen
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
