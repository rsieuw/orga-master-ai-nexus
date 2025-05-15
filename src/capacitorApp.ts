import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

/**
 * Initializes Capacitor functionalities for the application.
 * This function should be called when the application starts.
 * It performs the following actions:
 * - Shows the splash screen (required for iOS to hide the webview until ready).
 * - Adds event listeners for Capacitor app events like `appStateChange` and `backButton`.
 * Logs app state changes and back button presses to the console.
 * 
 * @async
 * @returns {Promise<void>} A promise that resolves when initialization is complete.
 * @throws Will log an error to the console if SplashScreen.show() fails, but does not re-throw.
 */
export const initCapacitor = async () => {
  // Show the splash screen when the app starts (iOS needs this)
  try {
    await SplashScreen.show();
  } catch (error) {
    console.error("Error showing splash screen:", error);
  }

  // Add other Capacitor app event listeners
  CapApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  });

  CapApp.addListener('backButton', () => {
    console.log('Back button clicked!');
    // You can add code here to determine what happens on back button press
  });
};