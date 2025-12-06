// src/app/api/admin/tickets/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendBase } from "../_proxy";

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    }

    const base = backendBase();
    const url = new URL(req.url);
    const target = new URL("/api/admin/tickets", base);

    // پارامترهای فعلی + include=user
    const sp = new URLSearchParams(url.search);
    if (!sp.has("include")) sp.set("include", "user");
    target.search = sp.toString();

    // ⬇️ timeout برای جلوگیری از آویزون شدن fetch
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 7000);

    let res: Response;
    try {
      res = await fetch(target.toString(), {
        method: "GET",
        headers: { "x-admin-token": token },
        cache: "no-store",
        signal: ac.signal,
      });
    } catch (err) {
      clearTimeout(t);
      console.error("proxy /api/admin/tickets fetch error:", err);
      return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
    }
    clearTimeout(t);

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = { ok: false, error: "invalid_json" };
    }

    // غنی‌سازی خروجی فقط وقتی ok و آرایه‌ی tickets داریم
    if (data?.ok && Array.isArray(data.tickets)) {
      data.tickets = data.tickets.map((t: any) => {
        const userNameRaw =
          t?.user?.name ||
          t?.user?.fullName ||
          t?.user?.full_name ||
          t?.createdBy?.name ||
          t?.owner?.name ||
          t?.profile?.fullName ||
          t?.userName ||
          t?.customer?.name ||
          null;

        const fallbackFromContact =
          t?.contact?.name ||
          t?.contact ||
          t?.email ||
          t?.phone ||
          null;

        const userName = userNameRaw || fallbackFromContact || null;
        const displayName = userName || t?.title || "—";
        return { ...t, userName, displayName };
      });
    }

    return NextResponse.json(data, { status: res.status || 200 });
  } catch (e: any) {
    console.error("proxy /api/admin/tickets fatal:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "proxy_error" },
      { status: 500 }
    );
  }
}