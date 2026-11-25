import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Bearer token on every outgoing request if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const rawAuth = localStorage.getItem('routewise_auth');
    if (rawAuth) {
      try {
        const parsed = JSON.parse(rawAuth);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        // Ignore JSON parsing errors
      }
    } else {
      const legacyToken = localStorage.getItem('routewise_token');
      if (legacyToken) {
        config.headers.Authorization = `Bearer ${legacyToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and network errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    // Network failure (server down, offline, CORS blocking, connection refused)
    if (!error.response) {
      error.message = 'Cannot reach server';
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || '';
    const isLoginEndpoint =
      requestUrl.includes('/auth/manager/login') ||
      requestUrl.includes('/auth/driver/login');

    // On 401 Unauthorized for non-login endpoints, clear session and redirect to /login
    if (error.response.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('routewise_auth');
      localStorage.removeItem('routewise_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
