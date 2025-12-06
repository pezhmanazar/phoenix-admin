// src/app/api/admin/_proxy.ts
import { cookies } from "next/headers";

export function backendBase() {
  return (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) || "http://127.0.0.1:4000";
}

export async function adminProxyHeaders() {
  const c = await cookies();
  const session = c.get("admin_session")?.value;
  const apiKey = c.get("admin_key")?.value || c.get("admin_api_key")?.value;

  const headers: Record<string, string> = {};
  if (session) {
    headers["x-admin-token"] = session; // سیستم جدید سشن
  } else if (apiKey) {
    headers["x-api-key"] = apiKey; // سازگاری قدیم
  } else {
    const err: any = new Error("no_cookie");
    err.status = 401;
    throw err;
  }
  return headers;
}