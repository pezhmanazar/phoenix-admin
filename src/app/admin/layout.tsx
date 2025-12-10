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

// ✅ دریافت اطلاعات ادمین از کوکی و بک‌اند
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

    let r = await fetch(`${base}/api/admin/verify`, {
      headers,
      cache: "no-store",
    });

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

// 🔹 بجای Tailwind، inline style مثل صفحه لاگین
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
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* هدر بالای همه صفحات ادمین */}
      <header
        style={{
          padding: "10px 24px",
          borderBottom: "1px solid #111827",
          backgroundColor: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        {/* لینک پنل ققنوس (سمت راست در تم RTL مرورگر) */}
        <Link
          href="/admin/tickets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 9999,
            border: "1px solid #374151",
            backgroundColor: "#020617",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            textDecoration: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden>🎛️</span>
          <span>پنل مدیریت ققنوس</span>
        </Link>

        {/* اطلاعات ادمین + دکمه‌ها (سمت چپ) */}
        {me ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {/* نام و نقش */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                maxWidth: "220px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  opacity: 0.85,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={me.email}
              >
                {me.name || me.email}
              </span>
              <RoleBadge role={me.role} />
            </div>

            {/* پروفایل */}
            <Link
              href="/admin/profile"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #374151",
                backgroundColor: "#111827",
                color: "#e5e7eb",
                fontSize: "12px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              پروفایل
            </Link>

            {/* فقط Owner: مدیریت ادمین‌ها */}
            {me.role === "owner" && (
              <Link
                href="/admin/admins"
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#0f766e",
                  color: "#ecfeff",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                مدیریت ادمین‌ها
              </Link>
            )}

            {/* خروج – کامپوننت کلاینتی را فقط در یک container می‌گذاریم */}
            <div
              style={{
                marginInlineStart: 4,
              }}
            >
              <LogoutButton />
            </div>
          </div>
        ) : null}
      </header>

      {/* محتوای صفحات */}
      <main
        style={{
          flex: 1,
          padding: "16px 16px 24px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}