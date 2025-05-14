import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n.ts'; // Importeer i18n configuratie
import { SplashScreen } from '@capacitor/splash-screen';

// Verberg de splash screen met een kleine vertraging
// om ervoor te zorgen dat de app eerst geladen wordt
document.addEventListener('DOMContentLoaded', () => {
  // Capacitor native bridge is al geladen
  setTimeout(() => {
    SplashScreen.hide();
  }, 800);
});

createRoot(document.getElementById("root")!).render(<App />);
