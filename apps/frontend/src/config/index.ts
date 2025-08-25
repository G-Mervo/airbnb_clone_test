/**
 * Application configuration management
 */

export interface AppConfig {
  // Data loading configuration
  dataSource: 'local' | 'api' | 'mock';
  apiBaseUrl: string;
  enableDataValidation: boolean;
  cacheEnabled: boolean;
  cacheDurationMs: number;

  // Feature flags
  features: {
    enableBooking: boolean;
    enablePayments: boolean;
    enableRealTimeData: boolean;
    enableOfflineMode: boolean;
    enableAnalytics: boolean;
  };

  // UI configuration
  ui: {
    itemsPerPage: number;
    enableInfiniteScroll: boolean;
    showSkeletonLoader: boolean;
    skeletonDuration: number;
  };

  // Development settings
  development: {
    enableDevTools: boolean;
    enableMockData: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

const defaultConfig: AppConfig = {
  dataSource: 'local',
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
  enableDataValidation: true,
  cacheEnabled: true,
  cacheDurationMs: 5 * 60 * 1000, // 5 minutes

  features: {
    enableBooking: true,
    enablePayments: true,
    enableRealTimeData: false,
    enableOfflineMode: true,
    enableAnalytics: true,
  },

  ui: {
    itemsPerPage: 20,
    enableInfiniteScroll: true,
    showSkeletonLoader: true,
    skeletonDuration: 2500,
  },

  development: {
    enableDevTools: import.meta.env.MODE === 'development',
    enableMockData: import.meta.env.MODE === 'development',
    logLevel: import.meta.env.MODE === 'development' ? 'debug' : 'error',
  },
};

// Configuration can be overridden by environment variables
const getConfigFromEnv = (): Partial<AppConfig> => {
  const config: Partial<AppConfig> = {};

  // Data source configuration
  if (import.meta.env.VITE_DATA_SOURCE) {
    config.dataSource = import.meta.env.VITE_DATA_SOURCE as 'local' | 'api' | 'mock';
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    config.apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.VITE_ENABLE_DATA_VALIDATION) {
    config.enableDataValidation = import.meta.env.VITE_ENABLE_DATA_VALIDATION === 'true';
  }

  if (import.meta.env.VITE_CACHE_ENABLED) {
    config.cacheEnabled = import.meta.env.VITE_CACHE_ENABLED === 'true';
  }

  if (import.meta.env.VITE_CACHE_DURATION_MS) {
    config.cacheDurationMs = parseInt(import.meta.env.VITE_CACHE_DURATION_MS, 10);
  }

  // Feature flags
  const features: Partial<AppConfig['features']> = {};

  if (import.meta.env.VITE_ENABLE_BOOKING) {
    features.enableBooking = import.meta.env.VITE_ENABLE_BOOKING === 'true';
  }

  if (import.meta.env.VITE_ENABLE_PAYMENTS) {
    features.enablePayments = import.meta.env.VITE_ENABLE_PAYMENTS === 'true';
  }

  if (import.meta.env.VITE_ENABLE_REALTIME) {
    features.enableRealTimeData = import.meta.env.VITE_ENABLE_REALTIME === 'true';
  }

  if (import.meta.env.VITE_ENABLE_OFFLINE) {
    features.enableOfflineMode = import.meta.env.VITE_ENABLE_OFFLINE === 'true';
  }

  if (import.meta.env.VITE_ENABLE_ANALYTICS) {
    features.enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  if (Object.keys(features).length > 0) {
    config.features = features as AppConfig['features'];
  }

  // UI configuration
  const ui: Partial<AppConfig['ui']> = {};

  if (import.meta.env.VITE_ITEMS_PER_PAGE) {
    ui.itemsPerPage = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE, 10);
  }

  if (import.meta.env.VITE_ENABLE_INFINITE_SCROLL) {
    ui.enableInfiniteScroll = import.meta.env.VITE_ENABLE_INFINITE_SCROLL === 'true';
  }

  if (import.meta.env.VITE_SHOW_SKELETON_LOADER) {
    ui.showSkeletonLoader = import.meta.env.VITE_SHOW_SKELETON_LOADER === 'true';
  }

  if (import.meta.env.VITE_SKELETON_DURATION) {
    ui.skeletonDuration = parseInt(import.meta.env.VITE_SKELETON_DURATION, 10);
  }

  if (Object.keys(ui).length > 0) {
    config.ui = ui as AppConfig['ui'];
  }

  return config;
};

// Merge default config with environment overrides
const envConfig = getConfigFromEnv();
export const appConfig: AppConfig = {
  ...defaultConfig,
  ...envConfig,
  features: {
    ...defaultConfig.features,
    ...envConfig.features,
  },
  ui: {
    ...defaultConfig.ui,
    ...envConfig.ui,
  },
  development: {
    ...defaultConfig.development,
    ...envConfig.development,
  },
};

// Utility functions
export const isProduction = () => import.meta.env.PROD;
export const isDevelopment = () => import.meta.env.MODE === 'development';
export const isFeatureEnabled = (feature: keyof AppConfig['features']) =>
  appConfig.features[feature];

// Logging utility
export const log = {
  error: (...args: any[]) => {
    if (['error', 'warn', 'info', 'debug'].includes(appConfig.development.logLevel)) {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (['warn', 'info', 'debug'].includes(appConfig.development.logLevel)) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (['info', 'debug'].includes(appConfig.development.logLevel)) {
      console.info('[INFO]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (appConfig.development.logLevel === 'debug') {
      console.debug('[DEBUG]', ...args);
    }
  },
};

export default appConfig;
