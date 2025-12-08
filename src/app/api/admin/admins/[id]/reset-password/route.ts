// src/app/api/admin/admins/[id]/reset-password/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE =
  (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
  "http://127.0.0.1:4000";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: any) {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // ✅ سازگار با هر دو حالت: params معمولی یا Promise<params>
    const rawParams = ctx?.params && typeof ctx.params.then === "function"
      ? await ctx.params
      : ctx?.params || {};

    const id = rawParams?.id as string | undefined;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "invalid_id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const r = await fetch(`${BASE}/api/admin/admins/${id}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const json = await r.json().catch(() => ({ ok: false, error: "bad_json" }));
    return NextResponse.json(json, { status: r.status });
  } catch (e: any) {
    console.error("proxy reset-password error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}