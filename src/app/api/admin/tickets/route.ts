// src/app/api/admin/tickets/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendBase } from "../_proxy";

type AdminTicket = {
  title?: string | null;
  contact?: string | { name?: string | null } | null;
  email?: string | null;
  phone?: string | null;
  userName?: string | null;

  user?: {
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
  } | null;

  createdBy?: {
    fullName?: string | null;
    name?: string | null;
  } | null;

  owner?: {
    fullName?: string | null;
    name?: string | null;
  } | null;

  profile?: {
    fullName?: string | null;
    name?: string | null;
  } | null;

  customer?: {
    fullName?: string | null;
    name?: string | null;
  } | null;

  [key: string]: unknown;
};

type AdminOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type TicketsProxyResponse = {
  ok?: boolean;
  error?: string;
  tickets?: AdminTicket[];

  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };

  adminOptions?: AdminOption[];

  [key: string]: unknown;
};

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 },
      );
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
      return NextResponse.json(
        { ok: false, error: "fetch_failed" },
        { status: 502 },
      );
    }
    clearTimeout(t);

    let data: TicketsProxyResponse;
    try {
      data = (await res.json()) as TicketsProxyResponse;
    } catch {
      data = { ok: false, error: "invalid_json" };
    }

    // غنی‌سازی خروجی فقط وقتی ok و آرایه‌ی tickets داریم
    if (data?.ok && Array.isArray(data.tickets)) {
      data.tickets = data.tickets.map((t: AdminTicket) => {
        const userNameRaw =
          t?.user?.fullName ||
          t?.user?.full_name ||
          t?.user?.name ||
          t?.createdBy?.fullName ||
          t?.createdBy?.name ||
          t?.owner?.fullName ||
          t?.owner?.name ||
          t?.profile?.fullName ||
          t?.profile?.name ||
          t?.userName ||
          t?.customer?.fullName ||
          t?.customer?.name ||
          null;

        const contactName =
          typeof t.contact === "object" && t.contact !== null
            ? t.contact.name || null
            : null;

        const contactValue = typeof t.contact === "string" ? t.contact : null;

        const fallbackFromContact =
          contactName || contactValue || t.email || t.phone || null;

        const userName = userNameRaw || fallbackFromContact || null;
        const displayName = userName || t?.title || "—";
        return { ...t, userName, displayName };
      });
    }

    return NextResponse.json(data, { status: res.status || 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "proxy_error";

    console.error("proxy /api/admin/tickets fatal:", message);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
