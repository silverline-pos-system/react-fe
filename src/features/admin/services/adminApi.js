import api from "@/lib/api";

const PASSWORD_RESET_COUNT_STREAM_PATH = "/api/v1/admin/password-requests/stream";

function normalizeListPayload(input) {
  if (Array.isArray(input)) {
    return input;
  }

  const candidates = [
    input?.users,
    input?.branches,
    input?.features,
    input?.requests,
    input?.passwordRequests,
    input?.logs,
    input?.activityLogs,
    input?.auditLogs,
    input?.data,
    input?.items,
    input?.content,
    input?.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function getApiUrl(path) {
  return new URL(path, api.defaults.baseURL || window.location.origin).toString();
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizePendingCountPayload(input) {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string") {
    const parsed = Number.parseInt(input.trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const candidates = [
    input?.pendingCount,
    input?.count,
    input?.total,
    input?.value,
    input?.data?.pendingCount,
    input?.data?.count,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const parsed = Number.parseInt(candidate.trim(), 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

async function readPendingCountStream(url, onCount, signal) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      ...getAuthHeaders(),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Stream request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream") && !contentType.includes("text/plain")) {
    throw new Error(`Unexpected stream content type: ${contentType || "unknown"}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataBuffer = "";

  const flushEvent = () => {
    if (!dataBuffer.trim()) {
      dataBuffer = "";
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(dataBuffer);
    } catch {
      parsed = dataBuffer.trim();
    }

    const count = normalizePendingCountPayload(parsed);
    if (count !== null) {
      onCount(count);
    }

    dataBuffer = "";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      flushEvent();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) {
        flushEvent();
        continue;
      }

      if (line.startsWith("data:")) {
        const chunk = line.slice(5).trimStart();
        dataBuffer = dataBuffer ? `${dataBuffer}\n${chunk}` : chunk;
      }
    }
  }
}

export function subscribeToPasswordResetPendingCount(onCount, onError = () => {}) {
  let stopped = false;
  let reconnectTimer = null;
  let abortController = null;
  let attempt = 0;

  const connect = async () => {
    if (stopped) return;

    abortController?.abort();
    abortController = new AbortController();

    try {
      await readPendingCountStream(getApiUrl(PASSWORD_RESET_COUNT_STREAM_PATH), onCount, abortController.signal);
      if (!stopped) {
        attempt = 0;
        reconnectTimer = setTimeout(connect, 1000);
      }
    } catch (error) {
      if (stopped) return;

      onError(error);
      const delay = Math.min(30000, 1000 * (2 ** attempt));
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    }
  };

  connect();

  return () => {
    stopped = true;
    abortController?.abort();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
  };
}

// ===== Admin Dashboard API Service =====

/**
 * Get today's total sales across all branches
 */
export const getTodaysSales = async () => {
  const response = await api.get("/v1/admin/dashboard/today-sales");
  return response.data;
};

/**
 * Get user statistics by role
 */
export const getUserStatsByRole = async () => {
  const response = await api.get("/v1/admin/dashboard/user-stats");
  return response.data;
};

/**
 * Get all branches with detailed info
 */
export const getAllBranches = async () => {
  const response = await api.get("/v1/admin/branches");
  return normalizeListPayload(response.data);
};

/**
 * Get branch summary by ID (for modal)
 */
export const getBranchSummary = async (branchId) => {
  try {
    const response = await api.get(`/v1/admin/branches/${branchId}/summary`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        branch: { id: branchId, name: "Unknown" },
        users: [],
        userCount: 0
      };
    }
    throw error;
  }
};

/**
 * Search branches by query
 */
export const searchBranches = async (query) => {
  const response = await api.get("/v1/admin/branches/search", {
    params: { q: query },
  });
  return normalizeListPayload(response.data);
};

/**
 * Get top performing branches by sales
 */
export const getTopBranchesBySales = async () => {
  const response = await api.get("/v1/admin/dashboard/top-branches");
  return normalizeListPayload(response.data);
};

/**
 * Get customer recurrence rate by branch
 */
export const getCustomerRecurrenceByBranch = async () => {
  const response = await api.get("/v1/admin/dashboard/customer-recurrence");
  return response.data;
};

/**
 * Get weekly sales trend
 */
export const getWeeklySalesTrend = async () => {
  const response = await api.get("/v1/admin/dashboard/weekly-trend");
  return response.data;
};

/**
 * Get real-time branch sales (for live updates)
 */
export const getBranchRealTimeSales = async (branchId) => {
  try {
    const response = await api.get(`/v1/admin/branches/${branchId}/realtime-sales`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        dailySales: 0,
        registeredCustomers: 0
      };
    }
    throw error;
  }
};

/**
 * Get dashboard overview stats
 */
export const getDashboardOverview = async () => {
  const response = await api.get("/v1/admin/dashboard/overview");
  return response.data;
};

// ===== User Management API =====

/**
 * Get all users
 */
export const getAllUsers = async () => {
  const response = await api.get("/v1/admin/users");
  return normalizeListPayload(response.data);
};

/**
 * Search users by employee ID or name
 */
export const searchUsers = async (query) => {
  const response = await api.get("/v1/admin/users/search", {
    params: { q: query },
  });
  return normalizeListPayload(response.data);
};

/**
 * Register a new manager (Admin can only register managers)
 */
export const registerManager = async (userData) => {
  const response = await api.post("/v1/admin/users/register-manager", userData);
  return response.data;
};

/**
 * Update user details
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/v1/admin/users/${userId}`, userData);
  return response.data;
};

/**
 * Delete a user
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/v1/admin/users/${userId}`);
  return response.data;
};

/**
 * Toggle user status (Active/Inactive)
 */
export const toggleUserStatus = async (userId) => {
  const response = await api.patch(`/v1/admin/users/${userId}/toggle-status`);
  return response.data;
};

// ===== Branch Management API =====

/**
 * Create a new branch
 */
export const createBranch = async (branchData) => {
  const response = await api.post("/v1/admin/branches", branchData);
  return response.data;
};

/**
 * Update branch details
 */
export const updateBranch = async (branchId, branchData) => {
  const response = await api.put(`/v1/admin/branches/${branchId}`, branchData);
  return response.data;
};

/**
 * Delete a branch
 */
export const deleteBranch = async (branchId) => {
  const response = await api.delete(`/v1/admin/branches/${branchId}`);
  return response.data;
};

/**
 * Toggle branch status (Active/Inactive)
 */
export const toggleBranchStatus = async (branchId) => {
  const response = await api.patch(`/v1/admin/branches/${branchId}/toggle-status`);
  return response.data;
};

/**
 * Get managers list (for branch assignment)
 */
export const getManagers = async () => {
  const response = await api.get("/v1/admin/users/managers");
  return response.data;
};

/**
 * Get users by branch
 */
export const getUsersByBranch = async (branchId) => {
  const response = await api.get(`/v1/admin/branches/${branchId}/users`);
  return normalizeListPayload(response.data);
};

// ===== System Activity Log API =====

/**
 * Get all activity logs
 */
export const getActivityLogs = async (filters = {}) => {
  const response = await api.get("/v1/admin/activity-logs", { params: filters });
  return normalizeListPayload(response.data);
};

/**
 * Search activity logs
 */
export const searchActivityLogs = async (query, filters = {}) => {
  const response = await api.get("/v1/admin/activity-logs/search", {
    params: { q: query, ...filters },
  });
  return normalizeListPayload(response.data);
};

// ===== Password Reset API =====

/**
 * Get user for password reset
 */
export const getUserForPasswordReset = async (userId) => {
  const response = await api.get(`/v1/admin/users/${userId}/password-info`);
  return response.data;
};

/**
 * Issue password reset for a user
 */
export const issuePasswordReset = async (userId, tempPassword) => {
  const response = await api.post(`/v1/admin/users/${userId}/password-reset`, {
    tempPassword,
  });
  return response.data;
};

/**
 * Generate temporary password (server-side)
 */
export const generateTempPassword = async () => {
  const response = await api.get("/v1/admin/users/generate-temp-password");
  return response.data;
};

// ===== Admin Password Verification for Destructive Actions =====

/**
 * Verify admin password before destructive actions.
 * Re-uses the login endpoint to validate credentials.
 */
export const verifyAdminPassword = async (password) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error("Not authenticated");

  let username;
  try {
    const user = JSON.parse(userStr);
    username = user.username || user.email || user.name;
    if (!username && user.sub) username = user.sub;
  } catch {
    throw new Error("Invalid user session data");
  }

  if (!username) throw new Error("Could not identify current user for verification");

  try {
    const response = await api.post("/v1/auth/login", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw new Error("Incorrect password");
    }
    throw error;
  }
};

/**
 * Delete a user with admin password verification
 */
export const deleteUserWithPassword = async (userId, password) => {
  await verifyAdminPassword(password);
  const response = await api.delete(`/v1/admin/users/${userId}`);
  return response.data;
};

/**
 * Delete a branch with admin password verification
 */
export const deleteBranchWithPassword = async (branchId, password) => {
  await verifyAdminPassword(password);
  const response = await api.delete(`/v1/admin/branches/${branchId}`);
  return response.data;
};

// ===== Password Reset Request Management API =====

/**
 * Get all password reset requests
 */
export const getPasswordResetRequests = async (status = null) => {
  const params = status ? `?status=${status}` : "";
  const response = await api.get(`/v1/admin/password-requests${params}`);
  return normalizeListPayload(response.data);
};

/**
 * Get count of pending password reset requests
 */
export const getPasswordResetPendingCount = async () => {
  const response = await api.get("/v1/admin/password-requests/count");
  return normalizePendingCountPayload(response.data);
};

/**
 * Approve a password reset request
 */
export const approvePasswordReset = async (requestId, adminNotes = "") => {
  const response = await api.patch(`/v1/admin/password-requests/${requestId}/approve`, {
    adminNotes,
  });
  return response.data;
};

/**
 * Reject a password reset request
 */
export const rejectPasswordReset = async (requestId, adminNotes = "") => {
  const response = await api.patch(`/v1/admin/password-requests/${requestId}/reject`, {
    adminNotes,
  });
  return response.data;
};

// ===== SaaS Feature Management API =====

/**
 * Get all SaaS features
 */
export const getAllFeatures = async () => {
  const response = await api.get("/v1/admin/saas/features");
  return normalizeListPayload(response.data);
};

/**
 * Get active features only
 */
export const getActiveFeatures = async () => {
  const response = await api.get("/v1/admin/saas/features/active");
  return normalizeListPayload(response.data);
};

/**
 * Request feature toggle - sends OTP to admin email
 */
export const requestFeatureToggle = async (featureCode, action) => {
  const response = await api.post("/v1/admin/saas/features/request-toggle", {
    featureCode,
    action,
  });
  return response.data;
};

/**
 * Request bulk feature toggle - sends one OTP to admin email
 */
export const requestBulkFeatureToggle = async (featureCodes, action) => {
  const response = await api.post("/v1/admin/saas/features/request-toggle-all", {
    featureCodes,
    action,
  });
  return response.data;
};

/**
 * Verify the verification key and toggle feature
 */
export const verifyFeatureToggle = async (featureCode, action, verificationKey) => {
  const response = await api.post("/v1/admin/saas/features/verify-toggle", {
    featureCode,
    action,
    verificationKey: parseInt(verificationKey),
  });
  return response.data;
};

/**
 * Verify bulk feature toggle with one verification key
 */
export const verifyBulkFeatureToggle = async (featureCodes, action, verificationKey) => {
  const response = await api.post("/v1/admin/saas/features/verify-toggle-all", {
    featureCodes,
    action,
    verificationKey: parseInt(verificationKey),
  });
  return response.data;
};

// ===== System Settings API =====

/**
 * Get system name
 */
export const getSystemName = async () => {
  const response = await api.get("/v1/admin/saas/settings/system-name");
  return response.data;
};

/**
 * Update system name
 */
export const updateSystemName = async (newName) => {
  const response = await api.put("/v1/admin/saas/settings/system-name", {
    settingKey: "SYSTEM_NAME",
    settingValue: newName,
  });
  return response.data;
};
