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

    // هدر فقط وقتی توکن داریم
    const headers: Record<string, string> = {};
    if (token.trim()) headers["x-admin-token"] = token.trim();

    // تلاش اول: /api/admin/verify
    let r = await fetch(`${base}/api/admin/verify`, {
      headers,
      cache: "no-store",
    });

    // اگر مسیر وجود نداشت یا 404 بود، فالبک به /api/admin/me
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
      ? "bg-emerald-700/30 text-emerald-300 border-emerald-700/50"
      : role === "manager"
      ? "bg-sky-700/30 text-sky-300 border-sky-700/50"
      : "bg-purple-700/30 text-purple-300 border-purple-700/50";
  const label =
    role === "owner" ? "Owner" : role === "manager" ? "Manager" : "Agent";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${style}`}>
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
      <header className="flex justify-between items-center p-4 border-b border-[#333] bg-[#0b0b0b]">
        <Link
          href="/admin/tickets"
          className="font-bold text-lg hover:text-orange-400"
        >
          🎛️ پنل مدیریت ققنوس
        </Link>

        <div className="flex items-center gap-3">
          {me ? (
            <>
              {/* نمایش نام و نقش */}
              <div className="flex items-center gap-2">
                <span className="opacity-80 text-sm">
                  {me.name || me.email}
                </span>
                {roleBadge(me.role)}
              </div>

              {/* ✅ لینک پروفایل */}
              <Link
                href="/admin/profile"
                className="px-3 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-white"
              >
                پروفایل
              </Link>

              {/* ✅ فقط برای Owner: فقط «مدیریت ادمین‌ها» (بدون دکمه افزودن) */}
              {me?.role === "owner" ? (
                <Link
                  href="/admin/admins"
                  className="px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-white"
                >
                  مدیریت ادمین‌ها
                </Link>
              ) : null}

              <LogoutButton />
            </>
          ) : null /* وقتی لاگین نیست، چیزی نمایش نده */}
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}