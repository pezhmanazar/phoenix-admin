import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  process.env.BACKEND_URL?.trim() ||
  "https://qoqnoos.app";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const token = (await cookies()).get("admin_token")?.value || "";
    const body = await req.json().catch(() => ({}));

    const r = await fetch(`${BACKEND}/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { "x-admin-token": token } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal_error" }, { status: 500 });
  }
}