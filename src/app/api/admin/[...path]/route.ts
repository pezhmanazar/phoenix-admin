// src/app/api/admin/[...path]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBackendBase() {
  const env =
    (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
    (process.env.NEXT_PUBLIC_API_BASE && process.env.NEXT_PUBLIC_API_BASE.trim());

  // اگر env خالی بود، fallback لوکال (روی سرور معمولاً 4000)
  return env || "http://127.0.0.1:4000";
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const base = getBackendBase();

  const path = pathParts.join("/");
  const url = new URL(req.url);
  const target = `${base}/api/admin/${path}${url.search}`;

  // ✅ Next 15: cookies() Promise است
  const token = (await cookies()).get("admin_token")?.value || "";

  // هدرها
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", req.headers.get("content-type") || "application/json");
  if (token) headers.set("x-admin-token", token);

  // بدنه (برای GET/HEAD نذار)
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

  const r = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const ct = r.headers.get("content-type") || "";
  const raw = await r.text().catch(() => "");

  return new NextResponse(raw, {
    status: r.status,
    headers: {
      "Content-Type": ct || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// ✅ Next 15: ctx.params Promise شده
type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}