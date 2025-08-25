/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DATA_SOURCE?: 'local' | 'api' | 'mock';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_DATA_VALIDATION?: string;
  readonly VITE_CACHE_ENABLED?: string;
  readonly VITE_CACHE_DURATION_MS?: string;
  readonly VITE_ENABLE_BOOKING?: string;
  readonly VITE_ENABLE_PAYMENTS?: string;
  readonly VITE_ENABLE_REALTIME?: string;
  readonly VITE_ENABLE_OFFLINE?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ITEMS_PER_PAGE?: string;
  readonly VITE_ENABLE_INFINITE_SCROLL?: string;
  readonly VITE_SHOW_SKELETON_LOADER?: string;
  readonly VITE_SKELETON_DURATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
