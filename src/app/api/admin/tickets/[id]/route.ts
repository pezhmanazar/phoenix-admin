// src/app/api/admin/tickets/[id]/route.ts
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

async function readJsonSafe(r: Response) {
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return { ok: false, error: "bad_response" };
  }
  return r.json().catch(() => ({ ok: false, error: "bad_json" }));
}

async function tokenFromCookie() {
  try {
    return (await cookies()).get("admin_token")?.value || "";
  } catch {
    return "";
  }
}

// دریافت جزئیات تیکت
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = await tokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const r = await fetch(`${BASE}/api/admin/tickets/${id}`, {
    headers: { "x-admin-token": token, Accept: "application/json" },
    cache: "no-store",
  });

  const json = await readJsonSafe(r);
  return NextResponse.json(json, { status: r.status });
}

// تغییر وضعیت یا آپدیت تیکت
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = await tokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${BASE}/api/admin/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await readJsonSafe(r);
  return NextResponse.json(json, { status: r.status });
}

// ارسال پاسخ (reply) به تیکت
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = await tokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${BASE}/api/admin/tickets/${id}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await readJsonSafe(r);
  return NextResponse.json(json, { status: r.status });
}

// حذف کامل تیکت (messages هم پاک می‌شوند)
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = await tokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  // بک‌اند شما: POST /api/admin/tickets/:id/delete
  const r = await fetch(`${BASE}/api/admin/tickets/${id}/delete`, {
    method: "POST",
    headers: { "x-admin-token": token, Accept: "application/json" },
    cache: "no-store",
  });

  const json = await readJsonSafe(r);
  return NextResponse.json(json, { status: r.status });
}