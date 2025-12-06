// src/app/api/admin/admins/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const r = await fetch(`${BASE}/api/admin/admins/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json(j, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "proxy_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    const r = await fetch(`${BASE}/api/admin/admins/${params.id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token },
    });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json(j, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "proxy_error" }, { status: 500 });
  }
}