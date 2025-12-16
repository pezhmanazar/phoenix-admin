// src/lib/api.ts
type ApiFetchInit = RequestInit & { json?: any };

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE &&
    process.env.NEXT_PUBLIC_API_BASE.trim()) ||
  "https://api.qoqnoos.app";

/**
 * Admin token is stored client-side (localStorage) after login.
 * We attach it to every request as x-admin-token.
 */
export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("admin_token") || "";
  } catch {
    return "";
  }
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("admin_token", token);
  } catch {}
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("admin_token");
  } catch {}
}

export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const token = getAdminToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // اگر body به صورت json پاس داده شد
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  if (token && !headers.has("x-admin-token")) {
    headers.set("x-admin-token", token);
  }

  return fetch(url, {
    ...init,
    headers,
    body,
  });
}

export async function apiFetchJson<T = any>(path: string, init: ApiFetchInit = {}) {
  const res = await apiFetch(path, init);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!ct.includes("application/json")) {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text);

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP_${res.status}`);
  }

  return json as T;
}