import api from "./api";

const MANAGER_API_BASE = "http://localhost:8080/api/v1/manager";
const ACCOUNTING_API_BASE = "http://localhost:8080/api/v1/accounting";
const REPORTS_API_BASE = "http://localhost:8080/api/v1/reports";

// Helper: get current logged-in user's branchId
function getMyBranchId() {
  try {
    // Priority: 1. Manually selected branch, 2. User object default branch
    const selectedId = localStorage.getItem('selectedBranchId');
    if (selectedId) return selectedId;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.branchId || null;
  } catch {
    return null;
  }
}

// ============================================
// DASHBOARD & STATISTICS
// ============================================

// Dashboard Stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/stats`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

// ============================================
// SALES & TRANSACTIONS
// ============================================

// Sales Data with Period
export const getSalesData = async (period = "weekly") => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/sales?period=${period}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw error;
  }
};

// Detailed Sales Analytics
export const getSalesAnalytics = async (period = "daily") => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/sales/analytics?period=${period}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    throw error;
  }
};

// Recent Transactions
export const getRecentTransactions = async (limit = 20) => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/sales/recent?limit=${limit}`);
    return response.data.data;
  } catch {
    // Non-critical endpoint: return empty list to keep dashboard stable.
    return [];
  }
};

// Payment Method Breakdown
export const getPaymentBreakdown = async (period = "daily") => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/sales/payment-breakdown?period=${period}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching payment breakdown:", error);
    throw error;
  }
};

// Hourly Sales Data
export const getHourlySales = async (date = null) => {
  try {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`${MANAGER_API_BASE}/sales/hourly${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching hourly sales:", error);
    throw error;
  }
};

// Top Selling Products
export const getTopSellingProducts = async (limit = 5) => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/products/top-selling?limit=${limit}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    throw error;
  }
};

// ============================================
// SALES REPORTS
// ============================================

// Sales Reports with Date Range
export const getSalesReports = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const response = await api.get(`${MANAGER_API_BASE}/reports/sales?${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching sales reports:", error);
    throw error;
  }
};

// Product Performance Report
export const getProductPerformanceReport = async (filters = {}) => {
  try {
    const response = await api.get(`${REPORTS_API_BASE}/products/performance`, { params: filters });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching product performance:", error);
    throw error;
  }
};

// Cashier Performance Report
export const getCashierPerformanceReport = async (filters = {}) => {
  try {
    const response = await api.get(`${REPORTS_API_BASE}/cashiers/performance`, { params: filters });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching cashier performance:", error);
    throw error;
  }
};

// ============================================
// INVENTORY & Dispatch
// ============================================

// Pending Dispatches
export const getPendingDispatches = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/dispatches/pending`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching pending Dispatches:", error);
    throw error;
  }
};

// Stock Alerts
export const getStockAlerts = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/inventory/alerts`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    throw error;
  }
};

// Expiry Alerts
export const getExpiryAlerts = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/inventory/expiry-alerts`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching expiry alerts:", error);
    throw error;
  }
};

// ============================================
// STAFF & USERS
// ============================================

// Staff Summary
export const getStaffSummary = async (branchIdOverride = undefined) => {
  try {
    const params = new URLSearchParams();
    const branchId = branchIdOverride !== undefined ? branchIdOverride : getMyBranchId();
    if (branchId) params.append('branchId', branchId);
    const query = params.toString() ? `?${params}` : '';
    const response = await api.get(`${MANAGER_API_BASE}/staff/summary${query}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching staff summary:", error);
    throw error;
  }
};

// Registered Users
export const getRegisteredUsers = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/users`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching registered users:", error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.patch(`${MANAGER_API_BASE}/users/${userId}/role`, { role });
    return response.data.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const updateUserActiveStatus = async (userId, isActive) => {
  try {
    const response = await api.patch(`${MANAGER_API_BASE}/users/${userId}/status`, { isActive });
    return response.data.data;
  } catch (error) {
    console.error("Error updating user active status:", error);
    throw error;
  }
};

// ============================================
// APPROVALS
// ============================================

const getCurrentRole = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return String(parsed?.role || '').toUpperCase() || null;
  } catch {
    return null;
  }
};

const canUseManagerApprovalsApi = () => {
  const role = getCurrentRole();
  return role === 'MANAGER' || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERVISOR';
};

// Branch Alerts
export const getBranchAlerts = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/alerts`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching branch alerts:", error);
    throw error;
  }
};

// Approvals (Generic)
export const getApprovals = async (status = null, branchIdOverride = undefined) => {
  if (!canUseManagerApprovalsApi()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const branchId = branchIdOverride !== undefined ? branchIdOverride : getMyBranchId();
    if (branchId) params.append('branchId', branchId);
    const query = params.toString() ? `?${params}` : '';
    const response = await api.get(`${MANAGER_API_BASE}/approvals${query}`, { silent: true });
    return response.data.data;
  } catch (error) {
    if (error?.response?.status !== 403) {
      console.error("Error fetching approvals:", error);
    }
    throw error;
  }
};

// My Recent Approvals (for cashiers to track their requests)
export const getMyApprovals = async () => {
  if (!canUseManagerApprovalsApi()) {
    return [];
  }

  try {
    const response = await api.get(`${MANAGER_API_BASE}/approvals/me`);
    return response.data.data;
  } catch (error) {
    if (error?.response?.status !== 403) {
      console.error("Error fetching my approvals:", error);
    }
    throw error;
  }
};

export const updateApprovalStatus = async (approvalId, status, notes = "", role = null) => {
  try {
    const userStr = localStorage.getItem('user');
    let approverId = null;
    if (userStr) {
      const user = JSON.parse(userStr);
      approverId = user.userId || user.id;
    }
    const response = await api.patch(`${MANAGER_API_BASE}/approvals/${approvalId}`, { status, notes, role, approverId });
    return response.data.data;
  } catch (error) {
    console.error("Error updating approval status:", error);
    throw error;
  }
};

export const createApprovalRequest = async (approvalData) => {
  try {
    const response = await api.post(`${MANAGER_API_BASE}/approvals`, approvalData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating approval request:", error);
    throw error;
  }
};

// User Registration Approvals
export const getUserRegistrations = async (status = "PENDING") => {
  try {
    const params = new URLSearchParams();
    params.append('status', status);
    const branchId = getMyBranchId();
    if (branchId) params.append('branchId', branchId);
    const response = await api.get(`${MANAGER_API_BASE}/approvals?${params}`);
    // Filter to only USER_REGISTRATION type - exclude cash flow (PAID_IN/PAID_OUT) and other approvals
    const filteredData = (response.data?.data || []).filter(item => item.type === "USER_REGISTRATION");
    return filteredData;
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    throw error;
  }
};

export const updateRegistrationStatus = async (registrationId, status, role) => {
  try {
    const response = await api.patch(`${MANAGER_API_BASE}/approvals/${registrationId}`, {
      status,
      role,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating registration status:", error);
    throw error;
  }
};

// Export Approval History PDF
export const getApprovalHistoryPdf = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/reports/approvals/pdf`, {
      responseType: 'blob', // Important for binary data
    });
    return response.data.data;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};

export const getSalesReportsPdf = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`${MANAGER_API_BASE}/reports/sales/pdf?${params}`, {
      responseType: 'blob',
    });
    return response.data.data;
  } catch (error) {
    console.error("Error downloading sales report PDF:", error);
    throw error;
  }
};

export const getBranchActivityLogPdf = async (limit = 100) => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/reports/activity-log/pdf?limit=${limit}`, {
      responseType: 'blob',
    });
    return response.data.data;
  } catch (error) {
    console.error("Error downloading activity log PDF:", error);
    throw error;
  }
};

export const getLoyaltyCustomersPdf = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/reports/loyalty/pdf`, {
      responseType: 'blob',
    });
    return response.data.data;
  } catch (error) {
    console.error("Error downloading loyalty customers PDF:", error);
    throw error;
  }
};

export const getDispatchListPdf = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/reports/dispatches/pdf`, {
      responseType: 'blob',
    });
    return response.data.data;
  } catch (error) {
    console.error("Error downloading Dispatch list PDF:", error);
    throw error;
  }
};

// ============================================
// BRANCH ACTIVITY LOG
// ============================================

// Branch Activity Log with filters
export const getBranchActivityLog = async (branchId = null, filters = {}) => {
  try {
    const params = new URLSearchParams();
    const bid = branchId || getMyBranchId() || 1;
    params.append('branchId', bid);

    // If date is provided, use the filter endpoint with start and end times
    if (filters.date) {
      const start = `${filters.date}T00:00:00`;
      const end = `${filters.date}T23:59:59`;
      params.append('start', start);
      params.append('end', end);

      const response = await api.get(`${MANAGER_API_BASE}/activity/filter?${params}`);
      return response.data.data || response.data;
    } else {
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.type) params.append('type', filters.type);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await api.get(`${MANAGER_API_BASE}/activity/recent?${params}`);
      return response.data.data || response.data;
    }
  } catch (error) {
    console.error("Error fetching activity log:", error);
    throw error;
  }
};

// Activity Statistics
export const getActivityStats = async (branchId = null) => {
  try {
    const bid = branchId || getMyBranchId() || 1;
    const response = await api.get(`${MANAGER_API_BASE}/activity/stats?branchId=${bid}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    throw error;
  }
};

// ============================================
// ACCOUNTING - CHART OF ACCOUNTS
// ============================================

// Get Chart of Accounts
export const getChartOfAccounts = async () => {
  try {
    const response = await api.get(`${ACCOUNTING_API_BASE}/chart-of-accounts`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    throw error;
  }
};

// Create Account
export const createAccount = async (accountData) => {
  try {
    const response = await api.post(`${ACCOUNTING_API_BASE}/accounts`, accountData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

// Update Account
export const updateAccount = async (accountId, accountData) => {
  try {
    const response = await api.put(`${ACCOUNTING_API_BASE}/accounts/${accountId}`, accountData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
};

// Delete Account
export const deleteAccount = async (accountId) => {
  try {
    const response = await api.delete(`${ACCOUNTING_API_BASE}/accounts/${accountId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// ============================================
// ACCOUNTING - JOURNAL ENTRIES
// ============================================

// Get Journal Entries with filters
export const getJournalEntries = async (filters = {}) => {
  try {
    const response = await api.get(`${ACCOUNTING_API_BASE}/journal-entries`, { params: filters });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
};

// Get Single Journal Entry
export const getJournalEntry = async (entryId) => {
  try {
    const response = await api.get(`${ACCOUNTING_API_BASE}/journal-entries/${entryId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    throw error;
  }
};

// Create Journal Entry
export const createJournalEntry = async (entryData) => {
  try {
    const response = await api.post(`${ACCOUNTING_API_BASE}/journal-entries`, entryData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
};

// Update Journal Entry (Draft only)
export const updateJournalEntry = async (entryId, entryData) => {
  try {
    const response = await api.put(`${ACCOUNTING_API_BASE}/journal-entries/${entryId}`, entryData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
};

// Post Journal Entry
export const postJournalEntry = async (entryId) => {
  try {
    const response = await api.post(`${ACCOUNTING_API_BASE}/journal-entries/${entryId}/post`);
    return response.data.data;
  } catch (error) {
    console.error("Error posting journal entry:", error);
    throw error;
  }
};

// Void Journal Entry
export const voidJournalEntry = async (entryId, reason) => {
  try {
    const response = await api.post(`${ACCOUNTING_API_BASE}/journal-entries/${entryId}/void`, { reason });
    return response.data.data;
  } catch (error) {
    console.error("Error voiding journal entry:", error);
    throw error;
  }
};

// ============================================
// ACCOUNTING - PROFIT & LOSS
// ============================================

// Get Profit & Loss Report
export const getProfitAndLoss = async (period = "monthly", dateRange = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('period', period);
    if (dateRange.from) params.append('from', dateRange.from);
    if (dateRange.to) params.append('to', dateRange.to);

    const response = await api.get(`${ACCOUNTING_API_BASE}/profit-loss?${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching P&L report:", error);
    throw error;
  }
};

// Get P&L Comparison (vs previous period)
export const getPLComparison = async (period = "monthly") => {
  try {
    const response = await api.get(`${ACCOUNTING_API_BASE}/profit-loss/comparison?period=${period}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching P&L comparison:", error);
    throw error;
  }
};

// Get Balance Sheet
export const getBalanceSheet = async (asOfDate = null) => {
  try {
    const params = asOfDate ? `?asOfDate=${asOfDate}` : '';
    const response = await api.get(`${ACCOUNTING_API_BASE}/balance-sheet${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching balance sheet:", error);
    throw error;
  }
};

// ============================================
// LOYALTY & CUSTOMERS
// ============================================

export const getLoyaltyStats = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/customers/stats`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching loyalty stats:", error);
    throw error;
  }
};

export const getLoyaltyCustomers = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/customers`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching loyalty customers:", error);
    throw error;
  }
};

export const updateCustomer = async (id, data) => {
  try {
    const response = await api.put(`${MANAGER_API_BASE}/customers/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const adjustCustomerPoints = async (id, points, reason) => {
  try {
    const response = await api.post(`${MANAGER_API_BASE}/customers/${id}/adjust-points`, { points, reason });
    return response.data.data;
  } catch (error) {
    console.error("Error adjusting points:", error);
    throw error;
  }
};

export const getTierRules = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/customers/active-tier-rules`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching tier rules:", error);
    throw error;
  }
};

export const updateTierRules = async (rules) => {
  try {
    const response = await api.post(`${MANAGER_API_BASE}/customers/active-tier-rules`, rules);
    return response.data.data;
  } catch (error) {
    console.error("Error updating tier rules:", error);
    throw error;
  }
};

export const getCustomerSales = async (id) => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/customers/${id}/sales`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching customer sales:", error);
    throw error;
  }
};

// ============================================
// SECONDARY ROLE ASSIGNMENTS
// ============================================

// Get all secondary role assignments for this branch
export const getSecondaryRoleAssignments = async () => {
  try {
    const branchId = getMyBranchId();
    const params = branchId ? `?branchId=${branchId}` : '';
    const response = await api.get(`${MANAGER_API_BASE}/secondary-roles${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching secondary role assignments:", error);
    throw error;
  }
};

// Assign a secondary role to a user
export const assignSecondaryRole = async ({ userId, secondaryRole, expiresAt, reason }) => {
  try {
    const response = await api.post(`${MANAGER_API_BASE}/secondary-roles`, {
      userId,
      secondaryRole,
      expiresAt,
      reason,
      assignedByBranchId: getMyBranchId(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error assigning secondary role:", error);
    throw error;
  }
};

// Revoke a secondary role assignment
export const revokeSecondaryRole = async (assignmentId) => {
  try {
    const response = await api.delete(`${MANAGER_API_BASE}/secondary-roles/${assignmentId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error revoking secondary role:", error);
    throw error;
  }
};

// Get active secondary role for current logged-in user
export const getMySecondaryRole = async () => {
  try {
    const response = await api.get(`${MANAGER_API_BASE}/secondary-roles/me`);
    return response.data || null; // { secondaryRole, expiresAt, reason } or null
  } catch (error) {
    // 404 or 403 = no active secondary role or no permission â€” not an error
    if (error?.response?.status === 404 || error?.response?.status === 403) return null;
    // Silently return null for any error â€” this is a non-critical check
    return null;
  }
};

// Explicitly log an activity
export const logActivity = async (activityData) => {
  try {
    const response = await api.post(`${MANAGER_API_BASE}/activity/log`, activityData);
    return response.data.data;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw for logging failures to avoid breaking UX
    return null;
  }
};

