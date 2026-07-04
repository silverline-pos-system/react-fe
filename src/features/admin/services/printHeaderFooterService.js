import api from "@/services/api";

const STORAGE_KEY = "print_header_footer_settings_v1";
const PRIMARY_API = "/v1/admin/print-settings/header-footer";

const DEFAULT_GLOBAL_SETTINGS = {
  header: {
    businessName: "Silverline",
    branchLine: "",
    address: "",
    contact: "",
    extraLine: "",
  },
  footer: {
    thankYouLine: "Thank you for your purchase!",
    policyLine: "Goods sold are not refundable without receipt.",
    poweredByLine: "*** Powered by ROCS ***",
    extraLine: "",
  },
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeBranchKey(branch) {
  if (!branch) return "global";
  const id = branch.id || branch.branchId || branch.branch_id;
  if (id !== undefined && id !== null && id !== "") return `branch:${id}`;
  const name = String(branch.name || branch.branchName || "").trim().toLowerCase();
  return name ? `name:${name}` : "global";
}

function getLoggedInBranchId() {
  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.branchId ?? parsed?.branch_id ?? null;
  } catch {
    return null;
  }
}

function resolveBranchId(branch) {
  return (
    branch?.id ??
    branch?.branchId ??
    branch?.branch_id ??
    getLoggedInBranchId()
  );
}

function getStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw, null);

  if (!parsed || typeof parsed !== "object") {
    return {
      global: { ...DEFAULT_GLOBAL_SETTINGS },
      branches: {},
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    global: {
      ...DEFAULT_GLOBAL_SETTINGS,
      ...(parsed.global || {}),
      header: {
        ...DEFAULT_GLOBAL_SETTINGS.header,
        ...(parsed.global?.header || {}),
      },
      footer: {
        ...DEFAULT_GLOBAL_SETTINGS.footer,
        ...(parsed.global?.footer || {}),
      },
    },
    branches: parsed.branches || {},
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

function setStore(nextStore) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...nextStore, updatedAt: new Date().toISOString() })
  );
}

export function getGlobalPrintHeaderFooterSettings() {
  return getStore().global;
}

export function getBranchPrintHeaderFooterSettings(branch) {
  const store = getStore();
  const key = normalizeBranchKey(branch);
  const override = store.branches[key];

  if (!override) return store.global;

  return {
    header: {
      ...store.global.header,
      ...(override.header || {}),
    },
    footer: {
      ...store.global.footer,
      ...(override.footer || {}),
    },
  };
}

function normalizeApiPayload(input) {
  const src = input?.data || input || {};
  return {
    header: {
      ...DEFAULT_GLOBAL_SETTINGS.header,
      ...(src.header || {}),
    },
    footer: {
      ...DEFAULT_GLOBAL_SETTINGS.footer,
      ...(src.footer || {}),
    },
  };
}

function patchLocalCacheForBranch(branch, nextSettings) {
  const store = getStore();
  const key = normalizeBranchKey(branch);
  const normalized = normalizeApiPayload(nextSettings);

  if (key === "global") {
    setStore({ ...store, global: normalized });
    return normalized;
  }

  setStore({
    ...store,
    branches: {
      ...store.branches,
      [key]: {
        header: {
          ...store.global.header,
          ...(normalized.header || {}),
        },
        footer: {
          ...store.global.footer,
          ...(normalized.footer || {}),
        },
      },
    },
  });

  return normalized;
}

export function saveGlobalPrintHeaderFooterSettings(nextSettings) {
  const store = getStore();
  const merged = {
    header: {
      ...DEFAULT_GLOBAL_SETTINGS.header,
      ...(nextSettings?.header || {}),
    },
    footer: {
      ...DEFAULT_GLOBAL_SETTINGS.footer,
      ...(nextSettings?.footer || {}),
    },
  };

  setStore({ ...store, global: merged });
  return merged;
}

export async function fetchGlobalPrintHeaderFooterSettings() {
  return getGlobalPrintHeaderFooterSettings();
}

export function saveBranchPrintHeaderFooterSettings(branch, nextSettings) {
  const store = getStore();
  const key = normalizeBranchKey(branch);
  if (key === "global") {
    return saveGlobalPrintHeaderFooterSettings(nextSettings);
  }

  const merged = {
    header: {
      ...store.global.header,
      ...(nextSettings?.header || {}),
    },
    footer: {
      ...store.global.footer,
      ...(nextSettings?.footer || {}),
    },
  };

  setStore({
    ...store,
    branches: {
      ...store.branches,
      [key]: merged,
    },
  });

  return merged;
}

export async function fetchBranchPrintHeaderFooterSettings(branch) {
  const branchId = resolveBranchId(branch);
  if (!branchId) {
    return getGlobalPrintHeaderFooterSettings();
  }

  try {
    const response = await api.get(PRIMARY_API, {
      params: { branchId },
      validateStatus: (status) => status < 500,
    });
    
    if (response.status === 200) {
      const normalized = normalizeApiPayload(response.data);
      patchLocalCacheForBranch(branch, normalized);
      return getBranchPrintHeaderFooterSettings(branch);
    }
    
    if (response.status === 403 || response.status === 404) {
      return getBranchPrintHeaderFooterSettings(branch);
    }
    
    return getBranchPrintHeaderFooterSettings(branch);
  } catch {
    return getBranchPrintHeaderFooterSettings(branch);
  }
}

export async function saveGlobalPrintHeaderFooterSettingsRemote(nextSettings) {
  return saveGlobalPrintHeaderFooterSettings(nextSettings);
}

export async function saveBranchPrintHeaderFooterSettingsRemote(branch, nextSettings) {
  const payload = normalizeApiPayload(nextSettings);
  const branchId = resolveBranchId(branch);

  if (!branchId) {
    return saveGlobalPrintHeaderFooterSettingsRemote(payload);
  }

  try {
    const response = await api.put(PRIMARY_API, payload, {
      params: { branchId },
    });
    const normalized = normalizeApiPayload(response.data || payload);
    patchLocalCacheForBranch(branch, normalized);
    return getBranchPrintHeaderFooterSettings(branch);
  } catch {
    return saveBranchPrintHeaderFooterSettings(branch, payload);
  }
}

export function clearBranchPrintHeaderFooterSettings(branch) {
  const store = getStore();
  const key = normalizeBranchKey(branch);
  if (key === "global") {
    return store.global;
  }

  const nextBranches = { ...store.branches };
  delete nextBranches[key];
  setStore({ ...store, branches: nextBranches });
  return store.global;
}

export async function clearBranchPrintHeaderFooterSettingsRemote(branch) {
  const branchId = resolveBranchId(branch);
  if (!branchId) {
    return getGlobalPrintHeaderFooterSettings();
  }

  try {
    await api.delete(PRIMARY_API, { params: { branchId } });
  } catch {
    // ignore
  }
  return clearBranchPrintHeaderFooterSettings(branch);
}

export function resolvePrintHeaderFooterForBranch(branchInfo) {
  return getBranchPrintHeaderFooterSettings(branchInfo);
}

export async function resolvePrintHeaderFooterForBranchRemote(branchInfo) {
  const branchId = resolveBranchId(branchInfo);
  if (!branchId) {
    return getGlobalPrintHeaderFooterSettings();
  }
  return fetchBranchPrintHeaderFooterSettings({ ...(branchInfo || {}), branchId });
}

export function getPrintHeaderFooterStoreSnapshot() {
  return getStore();
}

export const printHeaderFooterDefaults = DEFAULT_GLOBAL_SETTINGS;
