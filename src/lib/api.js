import { createApiClient } from './apiClient';

/**
 * Default API client (base `${origin}/api`), used across admin/manager services.
 * Interceptor behavior (auth, branch header, 401 handling, logging) lives in createApiClient.
 */
const api = createApiClient();

export default api;
