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

async function fetchMe(): Promise<AdminMe | null> {
  try {
    const token = (await cookies()).get("admin_token")?.value || "";
    const base =
      (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
      (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
      "http://127.0.0.1:4000";

    const headers: Record<string, string> = {};
    if (token.trim()) headers["x-admin-token"] = token.trim();

    let r = await fetch(`${base}/api/admin/verify`, { headers, cache: "no-store" });
    if (r.status === 404) r = await fetch(`${base}/api/admin/me`, { headers, cache: "no-store" });
    if (!r.ok) return null;

    const j = await r.json().catch(() => null);
    if (!j?.ok || !j?.admin) return null;
    return j.admin as AdminMe;
  } catch {
    return null;
  }
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;

  let bg = "#312e81";
  let border = "#4b5563";
  let color = "#e0e7ff";
  let label = "Agent";

  if (role === "owner") {
    bg = "#064e3b";
    border = "#059669";
    color = "#bbf7d0";
    label = "Owner";
  } else if (role === "manager") {
    bg = "#0f172a";
    border = "#38bdf8";
    color = "#bae6fd";
    label = "Manager";
  }

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color,
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await fetchMe();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "10px 18px",
          borderBottom: "1px solid #111827",
          backgroundColor: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        {/* راست: عنوان + اسم + نقش */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 280 }}>
          <Link
            href="/admin/tickets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 800,
              color: "rgba(255,255,255,0.92)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden>🎛️</span>
            <span>پنل مدیریت ققنوس</span>
          </Link>

          {me ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 320 }}>
              <span
                style={{
                  fontSize: "13px",
                  opacity: 0.9,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 190,
                }}
                title={me.email}
              >
                {me.name || me.email}
              </span>
              <RoleBadge role={me.role} />
            </div>
          ) : null}
        </div>

        {/* وسط: (حذف شد) */}
        <div style={{ flex: 1 }} />

        {/* چپ: دکمه‌ها */}
        {me ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            {/* مدیریت کاربران */}
            <Link
              href="/admin/users"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #7c3aed",
                backgroundColor: "#2e1065",
                color: "#f5f3ff",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              مدیریت کاربران
            </Link>

            {/* بنر همگانی (کنار مدیریت کاربران) */}
            <Link
              href="/admin/announcements"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ea580c",
                backgroundColor: "#7c2d12",
                color: "#ffedd5",
                fontSize: "12px",
                fontWeight: 900,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              title="مدیریت بنرهای همگانی اپ"
            >
              📣 بنر همگانی
            </Link>

            {/* مدیریت ادمین‌ها */}
            {me.role === "owner" && (
              <Link
                href="/admin/admins"
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #0f766e",
                  backgroundColor: "#0f766e",
                  color: "#ecfeff",
                  fontSize: "12px",
                  fontWeight: 800,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                مدیریت ادمین‌ها
              </Link>
            )}

            {/* ویرایش پروفایل */}
            <Link
              href="/admin/profile"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #374151",
                backgroundColor: "#111827",
                color: "#e5e7eb",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              ویرایش پروفایل
            </Link>

            {/* خروج */}
            <div>
              <LogoutButton />
            </div>
          </div>
        ) : null}
      </header>

      <main style={{ flex: 1, padding: "16px 16px 24px", boxSizing: "border-box" }}>{children}</main>
    </div>
  );
}