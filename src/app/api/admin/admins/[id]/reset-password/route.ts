import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const r = await fetch(`${BASE}/api/admin/admins/${params.id}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token, // مالک لازم است
      },
      body: JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    return NextResponse.json(json, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "proxy_error" }, { status: 500 });
  }
}