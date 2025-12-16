export async function backendFetch(path: string, init?: RequestInit) {
  if (!path.startsWith("/api/admin/")) {
    throw new Error(`backendFetch is only allowed for /api/admin/* paths. Got: ${path}`);
  }

  const base = process.env.BACKEND_URL;
  const apiKey = process.env.ADMIN_API_KEY;

  if (!base) throw new Error("BACKEND_URL is not set");
  if (!apiKey) throw new Error("ADMIN_API_KEY is not set");

  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data;
}