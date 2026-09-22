// ============================================================
// Xcalate API client
// Connects the travel-widget prototype to Adish's Django backend.
// ============================================================

const API_BASE = "http://127.0.0.1:8000/api";

async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

async function apiPost(path, body = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.detail || `API ${res.status}`);
  return data;
}

window.XcalateAPI = {
  // Meta
  health: () => apiGet("/health/"),
  languages: () => apiGet("/languages/"),
  voices: () => apiGet("/voices/"),

  // Places
  places: (params) => apiGet("/places/", params),
  placeDetail: (slug) => apiGet(`/places/${slug}/`),
  placeCategories: () => apiGet("/places/categories/"),

  // Regions
  regions: () => apiGet("/regions/"),
  regionDetail: (slug) => apiGet(`/regions/${slug}/`),
  regionDownload: (slug) => apiGet(`/regions/${slug}/download/`),

  // Homestays
  homestays: (params) => apiGet("/homestays/", params),
  homestayDetail: (slug) => apiGet(`/homestays/${slug}/`),
  createBooking: (slug, body, token) => apiPost(`/homestays/${slug}/bookings/`, body, token),
  createReview: (slug, body, token) => apiPost(`/homestays/${slug}/reviews/`, body, token),

  // Marketplace
  listings: (params) => apiGet("/marketplace/listings/", params),
  listingDetail: (slug) => apiGet(`/marketplace/listings/${slug}/`),
  marketplaceCategories: () => apiGet("/marketplace/categories/"),
  contactSeller: (slug, body, token) => apiPost(`/marketplace/listings/${slug}/contact/`, body, token),

  // Auth
  register: (body) => apiPost("/auth/register/", body),
  login: (username, password) => apiPost("/auth/login/", { username, password }),
  refresh: (refresh) => apiPost("/auth/refresh/", { refresh }),
  me: (token) => fetch(API_BASE + "/auth/me/", {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json()),

  // AI
  askCompanion: (body) => apiPost("/companion/ask/", body),
  voiceTranslate: (formData) => fetch(API_BASE + "/voice/translate/", {
    method: "POST",
    body: formData,
    credentials: "include",
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || data.detail || `API ${r.status}`);
    return data;
  }),
  translate: (body) => apiPost("/text/translate/", body),
  tts: (body) => apiPost("/text/tts/", body),
};

// Play base64 audio returned by any endpoint
window.playBase64Audio = function (base64, format = "mp3") {
  if (!base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: `audio/${format}` });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  audio.play().catch(e => console.warn("[audio] autoplay blocked:", e));
  return audio;
};

// Auth token helpers
window.xcalateAuth = {
  getToken: () => localStorage.getItem("access_token") || localStorage.getItem("xcalate_access"),
  setTokens: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("xcalate_access", access);
    if (refresh) {
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("xcalate_refresh", refresh);
    }
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("xcalate_access");
    localStorage.removeItem("xcalate_refresh");
  },
};
