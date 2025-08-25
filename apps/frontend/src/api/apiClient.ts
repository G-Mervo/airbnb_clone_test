/**
 * API Client for interacting with the backend server
 */

// Base URL for API endpoints - configurable via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AUTH_DATA_KEY = 'auth_data';
// Configuration from environment variables
const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10),
  enableLogging: import.meta.env.VITE_API_ENABLE_LOGGING === 'true',
} as const;

// Helper for making API requests with proper headers and error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage if available
  let token: string | null = null;
  const rawAuthData = localStorage.getItem(AUTH_DATA_KEY);

  if (rawAuthData) {
    try {
      const authData = JSON.parse(rawAuthData);
      if (authData && authData.access_token) {
        token = authData.access_token;
      }
    } catch (e) {
      console.error('Failed to parse auth data from localStorage', e);
    }
  }

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Create AbortController for timeout handling and compose with external signal if provided
  const controller = new AbortController();
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    if (API_CONFIG.enableLogging) {
      console.log(`[API] ${options.method || 'GET'} ${API_CONFIG.baseUrl}${endpoint}`);
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort as any);
    }

    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `API Error: ${response.status}`);

      if (API_CONFIG.enableLogging) {
        console.error(`[API Error] ${response.status}:`, error.message);
      }

      throw error;
    }

    // If the response is 204 No Content, return null
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response
    const data = await response.json();

    if (API_CONFIG.enableLogging) {
      console.log(`[API Success] ${options.method || 'GET'} ${endpoint}`, data);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${API_CONFIG.timeout}ms`);
        console.error('API Request Timeout:', timeoutError);
        throw timeoutError;
      }
    }

    console.error('API Request Error:', error);
    throw error;
  }
}

// Export convenience methods for different HTTP methods
export const api = {
  get: (endpoint: string, params = {}, options: RequestInit = {}) => {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url, { ...options, method: 'GET' });
  },

  post: (endpoint: string, data: any, options: RequestInit = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  put: (endpoint: string, data: any, options: RequestInit = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  patch: (endpoint: string, data: any, options: RequestInit = {}) => {
    return apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete: (endpoint: string, options: RequestInit = {}) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },
};

export default api;
