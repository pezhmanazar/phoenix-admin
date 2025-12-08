// src/app/api/admin/admins/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

// GET: دریافت جزئیات یک ادمین
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const r = await fetch(`${BASE}/api/admin/admins/${id}`, {
      headers: { "x-admin-token": token },
      cache: "no-store",
    });

    const json = await r.json().catch(() => ({ ok: false, error: "bad_json" }));
    return NextResponse.json(json, { status: r.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "proxy_error" },
      { status: 500 }
    );
  }
}

// PATCH: ویرایش یک ادمین (مثلاً نقش، وضعیت، اسم و ...)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const r = await fetch(`${BASE}/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(body),
    });

    const json = await r.json().catch(() => ({ ok: false, error: "bad_json" }));
    return NextResponse.json(json, { status: r.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "proxy_error" },
      { status: 500 }
    );
  }
}

// DELETE: حذف یک ادمین
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const r = await fetch(`${BASE}/api/admin/admins/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": token,
      },
    });

    const json = await r.json().catch(() => ({ ok: false, error: "bad_json" }));
    return NextResponse.json(json, { status: r.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "proxy_error" },
      { status: 500 }
    );
  }
}