/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Üretimde Fly API kökü, örn. https://akilli-diyet-api.fly.dev (sonunda / olmasın) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
