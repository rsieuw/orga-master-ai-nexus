/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  // eventuele andere VITE_ variabelen
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
