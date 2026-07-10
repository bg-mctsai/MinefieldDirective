/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_TOOLS?: string;
  readonly VITE_UNLOCK_ALL_LEVELS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
