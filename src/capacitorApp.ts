import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export const initCapacitor = async () => {
  // Toon de splash screen als de app start (iOS heeft dit nodig)
  await SplashScreen.show();

  // Voeg andere Capacitor app event listeners toe
  CapApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  });

  CapApp.addListener('backButton', () => {
    console.log('Back button clicked!');
    // Hier kun je code toevoegen om te bepalen wat er gebeurt bij back button
  });
};