// Single source of truth for the backend origin.
//
// Set VITE_API_URL (the backend origin, e.g. https://api.silverline.example) in the deploy
// environment. In dev it falls back to localhost. Never hardcode the origin anywhere else:
// import API_ORIGIN / API_BASE / API_V1 from here instead.
export const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_BASE = `${API_ORIGIN}/api`;
export const API_V1 = `${API_ORIGIN}/api/v1`;
