import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Laadt vertalingen via http (bijv. vanuit de public map)
  .use(LanguageDetector) // Detecteert de gebruikerstaal
  .use(initReactI18next) // Initialiseert react-i18next
  .init({
    supportedLngs: ['en', 'nl'], // Ondersteunde talen
    fallbackLng: 'en', // Fallbacktaal als de gedetecteerde taal niet beschikbaar is
    debug: import.meta.env.DEV, // Enable debug mode during development
    interpolation: {
      escapeValue: false, // React doet dit al, dus niet nodig voor i18next
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Pad naar de vertaalbestanden
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'uiLanguage', // Key voor localStorage
    },
    react: {
      useSuspense: true // Expliciet aanzetten voor de zekerheid
    }
  });

export default i18n; 