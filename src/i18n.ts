import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

/**
 * @fileoverview Initializes and configures the i18next library for internationalization (i18n).
 * This setup includes:
 * - Using `HttpApi` to load translation files from a backend (e.g., `/public/locales`).
 * - Employing `LanguageDetector` to automatically detect the user's language.
 * - Integrating with React using `initReactI18next`.
 * - Defining supported languages, fallback language, debug mode, and backend load path.
 * - Configuring language detection order and caching mechanisms.
 */

i18n
  .use(HttpApi) // Loads translations via http (e.g., from the public folder)
  .use(LanguageDetector) // Detects the user's language
  .use(initReactI18next) // Initializes react-i18next
  .init({
    /**
     * Array of languages supported by the application.
     * @type {string[]}
     */
    supportedLngs: ['en', 'nl'], 
    /**
     * Default language to use if the detected language is not available or supported.
     * @type {string}
     */
    fallbackLng: 'en', 
    /**
     * Enables or disables debug output from i18next.
     * Set to true during development (`import.meta.env.DEV`) for helpful console logs.
     * @type {boolean}
     */
    debug: import.meta.env.DEV, 
    interpolation: {
      /**
       * Disables i18next's default value escaping.
       * React already handles XSS protection, so this is not needed from i18next.
       * @type {boolean}
       */
      escapeValue: false, 
    },
    backend: {
      /**
       * Path template for loading translation JSON files.
       * `{{lng}}` is replaced with the language code (e.g., 'en').
       * `{{ns}}` is replaced with the namespace (defaults to 'translation').
       * @type {string}
       */
      loadPath: '/locales/{{lng}}/{{ns}}.json', 
    },
    detection: {
      /**
       * Order in which language detection methods are tried.
       * @type {string[]}
       */
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      /**
       * Specifies which detection methods should cache the detected language.
       * Here, only 'localStorage' is used for caching.
       * @type {string[]}
       */
      caches: ['localStorage'],
      /**
       * The key used to store the detected language in localStorage.
       * @type {string}
       */
      lookupLocalStorage: 'uiLanguage', 
    },
    react: {
      /**
       * Explicitly enables React Suspense integration for translations.
       * This allows components to suspend while translations are loading.
       * @type {boolean}
       */
      useSuspense: true 
    }
  });

export default i18n; 