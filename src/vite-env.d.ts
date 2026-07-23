/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVENT_REGISTRATION_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
