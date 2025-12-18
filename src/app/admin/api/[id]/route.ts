import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function backendBase(): string {
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
    (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
    "http://127.0.0.1:4000"
  );
}

async function adminTokenFromCookie(): Promise<string> {
  try {
    const c = await cookies(); // ✅ Next 15: cookies() async
    return c.get("admin_token")?.value || "";
  } catch {
    return "";
  }
}

type Ctx = { params: Promise<{ id: string }> }; // ✅ Next 15: params can be Promise

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const token = await adminTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${backendBase()}/api/admin/announcements/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text();
  const ct = r.headers.get("content-type") || "";

  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: `Non-JSON response (${r.status})`, raw: text.slice(0, 200) },
      { status: 502 }
    );
  }

  const json = JSON.parse(text);
  return NextResponse.json(json, { status: r.status });
}