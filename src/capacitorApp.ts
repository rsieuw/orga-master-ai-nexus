import { App as CapApp } from '@capacitor/app';

/**
 * Initializes Capacitor functionalities for the application.
 * This function should be called when the application starts.
 * It performs the following actions:
 * - Adds event listeners for Capacitor app events like `appStateChange` and `backButton`.
 * 
 * Note: SplashScreen functionaliteit is verwijderd om dubbele splash screens te voorkomen.
 * De native Android 12+ splash screen API wordt nu gebruikt.
 * 
 * @async
 * @returns {Promise<void>} A promise that resolves when initialization is complete.
 */
export const initCapacitor = async () => {
  // SplashScreen.show() is verwijderd om dubbele splash screens te voorkomen

  // Add other Capacitor app event listeners
  CapApp.addListener('appStateChange', () => {
    // Debug logging removed
  });

  CapApp.addListener('backButton', () => {
    // Debug logging removed
    // You can add code here to determine what happens on back button press
  });
};