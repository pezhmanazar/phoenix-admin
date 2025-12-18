import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
    (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
    "http://127.0.0.1:4000"
  );
}

async function adminTokenFromCookie(): Promise<string> {
  try {
    const jar = await cookies();
    return jar.get("admin_token")?.value || "";
  } catch {
    return "";
  }
}

async function proxy(req: Request, targetPath: string) {
  const token = await adminTokenFromCookie();
  const base = backendBase();

  const url = new URL(req.url);
  const targetUrl = `${base}${targetPath}${url.search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token.trim()) headers["x-admin-token"] = token.trim();

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET") {
    const bodyText = await req.text().catch(() => "");
    init.body = bodyText || "{}";
  }

  const r = await fetch(targetUrl, init);
  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  return proxy(req, "/api/admin/announcements");
}

export async function POST(req: Request) {
  return proxy(req, "/api/admin/announcements");
}