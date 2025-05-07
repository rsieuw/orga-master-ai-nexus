import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n.ts'; // Importeer i18n configuratie

createRoot(document.getElementById("root")!).render(<App />);
