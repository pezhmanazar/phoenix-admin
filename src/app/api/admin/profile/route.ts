import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) || "http://127.0.0.1:4000";

export async function GET() {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    const r = await fetch(`${BASE}/api/admin/me`, {
      headers: { "x-admin-token": token },
      cache: "no-store",
    });
    const json = await r.json().catch(() => ({}));
    return NextResponse.json(json, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "proxy_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const r = await fetch(`${BASE}/api/admin/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(body),
    });

    const json = await r.json().catch(() => ({}));
    return NextResponse.json(json, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "proxy_error" }, { status: 500 });
  }
}