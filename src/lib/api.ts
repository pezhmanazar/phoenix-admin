// src/lib/api.ts
type ApiFetchInit = RequestInit & { json?: any };

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

export async function apiFetch(url: string, init: ApiFetchInit = {}) {
  const { json, headers, ...rest } = init;

  // ✅ اگر مسیر از نوع /api/... بود، حتماً نسبی بزن (same-origin روی admin.qoqnoos.app)
  // تا کوکی درست ست/ارسال بشه و CORS هم نخوری.
  const finalUrl =
    isAbsoluteUrl(url) || url.startsWith("/api/")
      ? url
      : `${process.env.NEXT_PUBLIC_API_BASE || ""}${url}`;

  const h = new Headers(headers || {});
  if (json !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }

  return fetch(finalUrl, {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : (rest as any).body,
    // ✅ حیاتی: کوکی‌ها برای لاگین/سشن
    credentials: "include",
  });
}