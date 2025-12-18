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

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const token = await adminTokenFromCookie();
  const base = backendBase();
  const id = ctx.params.id;

  const targetUrl = `${base}/api/admin/announcements/${encodeURIComponent(id)}/delete`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token.trim()) headers["x-admin-token"] = token.trim();

  const r = await fetch(targetUrl, {
    method: "POST",
    headers,
    cache: "no-store",
    body: "{}",
  });

  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}