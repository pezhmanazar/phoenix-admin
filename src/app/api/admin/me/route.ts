// src/app/api/admin/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

export async function GET() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_cookie" }, { status: 401 });
  }

  const res = await fetch(`${BASE}/api/admin/verify`, {
    headers: { "x-admin-token": token },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!json?.ok) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, admin: json.admin });
}