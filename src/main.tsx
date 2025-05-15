import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n.ts'; // Import i18n configuration
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * @fileoverview Main entry point for the React application.
 * Initializes the React root, imports necessary CSS and configurations (i18n),
 * and handles the hiding of the native splash screen.
 */

/**
 * Event listener for the `DOMContentLoaded` event.
 * Hides the native splash screen after a short delay once the DOM is fully loaded and parsed.
 * This ensures the webview content is ready before the splash screen disappears, providing a smoother transition.
 * The delay helps accommodate for any initial rendering or setup in the webview.
 */
// Hide the splash screen with a small delay
// to ensure the app is loaded first
document.addEventListener('DOMContentLoaded', () => {
  // Capacitor native bridge is already loaded
  setTimeout(() => {
    SplashScreen.hide();
  }, 800);
});

/**
 * Creates the React root and renders the main `App` component into the DOM element with the ID "root".
 * This is the starting point for the React application rendering.
 */
createRoot(document.getElementById("root")!).render(<App />);
