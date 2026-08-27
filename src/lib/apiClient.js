import axios from 'axios';
import { API_BASE } from './config';

const isDev = import.meta.env.DEV;

/**
 * Creates an axios instance with the app's standard interceptors so every service shares one
 * definition of: auth header, branch header, 401 handling, and error logging. Pass a base URL
 * (defaults to `${origin}/api`); services that talk to a sub-path pass their own.
 *
 * Previously each service re-declared its own interceptors, which drifted (some redirected on 401,
 * some did not; some logged every request). This centralizes that behavior.
 */
export function createApiClient(baseURL = API_BASE) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;

      const branchId = localStorage.getItem('selectedBranchId');
      if (branchId) config.headers['X-Branch-ID'] = branchId;

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      // Session expired / invalid: clear credentials and bounce to login (guarded against a loop
      // when the failing request is itself on the login page).
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      // Dev-only diagnostics (stripped from production builds); opt out per-request with { silent: true }.
      if (isDev && !error.config?.silent) {
        console.error('[API]', status ?? 'ERR', error.config?.method?.toUpperCase(), error.config?.url, error.response?.data ?? error.message);
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export default createApiClient;
