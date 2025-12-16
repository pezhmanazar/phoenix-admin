// src/lib/api.ts

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").trim();

// هر چیزی که با /api/ شروع شد => همیشه same-origin (admin.qoqnoos.app)
function resolveUrl(input: string) {
  if (input.startsWith("/api/")) return input;

  // اگر absolute بود دست نزن
  if (/^https?:\/\//i.test(input)) return input;

  // بقیه چیزها بره سمت API_BASE (مثل https://api.qoqnoos.app)
  if (!API_BASE) return input;
  return `${API_BASE}${input.startsWith("/") ? "" : "/"}${input}`;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = resolveUrl(input);

  return fetch(url, {
    ...init,
    credentials: "include", // مهم برای کوکی‌ها
  });
}