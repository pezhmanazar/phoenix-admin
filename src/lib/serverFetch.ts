export async function backendFetch(path: string, init?: RequestInit) {
  const base = process.env.BACKEND_URL;
  const apiKey = process.env.ADMIN_API_KEY;

  if (!base) throw new Error("BACKEND_URL is not set (check env.local)");
  if (!apiKey) throw new Error("ADMIN_API_KEY is not set (check env.local)");

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

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