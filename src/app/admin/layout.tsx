// src/app/admin/layout.tsx
import Link from "next/link";
import React from "react";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton.client";

export const dynamic = "force-dynamic";

type AdminMe = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "agent";
};

// ✅ دریافت اطلاعات ادمین از کوکی و بررسی در بک‌اند
async function fetchMe(): Promise<AdminMe | null> {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    const base =
      (process.env.NEXT_PUBLIC_BACKEND_URL &&
        process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
      (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
      "http://127.0.0.1:4000";

    const headers: Record<string, string> = {};
    if (token.trim()) headers["x-admin-token"] = token.trim();

    // تلاش اول: /api/admin/verify
    let r = await fetch(`${base}/api/admin/verify`, {
      headers,
      cache: "no-store",
    });

    // فالبک به /api/admin/me
    if (r.status === 404) {
      r = await fetch(`${base}/api/admin/me`, {
        headers,
        cache: "no-store",
      });
    }

    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    if (!j?.ok || !j?.admin) return null;
    return j.admin as AdminMe;
  } catch {
    return null;
  }
}

function roleBadge(role?: string) {
  if (!role) return null;
  const style =
    role === "owner"
      ? "bg-emerald-700/25 text-emerald-200 border-emerald-600/60"
      : role === "manager"
      ? "bg-sky-700/25 text-sky-200 border-sky-600/60"
      : "bg-purple-700/25 text-purple-200 border-purple-600/60";

  const label =
    role === "owner" ? "Owner" : role === "manager" ? "Manager" : "Agent";

  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-[11px] sm:text-xs ${style}`}
    >
      {label}
    </span>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchMe();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 🔹 هدر تمیز مثل صفحه لاگین + کانتینر وسط‌چین */}
      <header className="border-b border-[#333] bg-[#050505]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-4">
          {/* برند پنل مدیریت */}
          <Link
            href="/admin/tickets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              border: "1px solid #444",
              backgroundColor: "#111",
              padding: "8px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.2,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <span aria-hidden>🎛️</span>
            <span>پنل مدیریت ققنوس</span>
          </Link>

          {me ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* نام و نقش */}
              <div className="flex flex-col items-end leading-tight text-xs sm:text-sm">
                <span className="font-semibold truncate max-w-[180px] sm:max-w-xs">
                  {me.name || me.email}
                </span>
                <div className="mt-1">{roleBadge(me.role)}</div>
              </div>

              {/* دکمه‌ها */}
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/profile"
                  className="px-3 py-1.5 bg-[#202020] hover:bg-[#333] rounded-lg text-xs sm:text-sm"
                >
                  پروفایل
                </Link>

                {me.role === "owner" && (
                  <Link
                    href="/admin/admins"
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 rounded-lg text-xs sm:text-sm"
                  >
                    مدیریت ادمین‌ها
                  </Link>
                )}

                <LogoutButton />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* 🔹 بدنه: محدود به max-width مثل لاگین، نه فول‌اسکرین شلخته */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}