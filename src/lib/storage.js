/*
  Simple localStorage helpers used by the dashboards.
  Later you can replace these with real API calls.
*/

export const STORAGE_KEYS = {
  users: "srp_users",
  activity: "srp_activity",
  branches: "srp_branches",
  quickItems: "pos_quick_pick_items",
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeParse(raw, fallback);
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getQuickItems() {
  return loadJSON(STORAGE_KEYS.quickItems, []);
}

export function saveQuickItemsHelper(items) {
  saveJSON(STORAGE_KEYS.quickItems, items);
}


export function ensureAdminSeed({ seedUsers, seedActivity, seedBranches }) {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    saveJSON(STORAGE_KEYS.users, seedUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.activity)) {
    saveJSON(STORAGE_KEYS.activity, seedActivity);
  }
  if (!localStorage.getItem(STORAGE_KEYS.branches)) {
    saveJSON(STORAGE_KEYS.branches, seedBranches);
  }
}

export function getUsers() {
  return loadJSON(STORAGE_KEYS.users, []);
}

export function setUsers(users) {
  saveJSON(STORAGE_KEYS.users, users);
}

export function getActivity() {
  return loadJSON(STORAGE_KEYS.activity, []);
}

export function setActivity(activity) {
  saveJSON(STORAGE_KEYS.activity, activity);
}

export function addActivity(event) {
  const current = getActivity();
  const id = event.id || `E-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const next = [{ ...event, id }, ...current];
  setActivity(next);
  return next;
}
