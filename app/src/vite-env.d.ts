/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NARRATOR_MODE?: 'mock' | 'proxy'
  readonly VITE_NARRATOR_PROXY_URL?: string
  readonly VITE_NARRATOR_MOCK_DELAY_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
