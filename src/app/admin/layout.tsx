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
    const token = cookies().get("admin_token")?.value || "";
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
        fontWeight: 800,
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      }}
    >
      {label}
    </span>
  );
}

const navBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  borderRadius: 12,
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  whiteSpace: "nowrap",
  lineHeight: 1,
  flex: "0 0 auto",
};

function AdminNavLink({
  href,
  title,
  icon,
  children,
  style,
}: {
  href: string;
  title: string;
  icon: string;
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <Link href={href} style={style} title={title}>
      <span aria-hidden>{icon}</span>
      <span className="admin-nav-label">{children}</span>
    </Link>
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
          padding: "10px 14px",
          borderBottom: "1px solid #111827",
          backgroundColor: "#020617",
          boxSizing: "border-box",
        }}
      >
        <div className="admin-header">
          <div className="admin-header-left">
            <Link
              href="/admin/analytics"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                padding: "9px 14px",
                fontSize: "13px",
                fontWeight: 900,
                color: "rgba(255,255,255,0.92)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                lineHeight: 1,
                flex: "0 0 auto",
                maxWidth: "100%",
              }}
              title="بازگشت به صفحه اصلی پنل"
            >
              <span aria-hidden>📊</span>
              <span className="admin-brand-text">پنل مدیریت ققنوس</span>
            </Link>

            {me ? (
              <div className="admin-user-chip">
                <span
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                  title={me.email}
                >
                  {me.name || me.email}
                </span>
                <RoleBadge role={me.role} />
              </div>
            ) : null}
          </div>

          {me ? (
            <div className="admin-header-actions">
              <AdminNavLink
                href="/admin/users"
                title="مدیریت کاربران"
                icon="👥"
                style={{
                  ...navBase,
                  border: "1px solid #7c3aed",
                  backgroundColor: "#2e1065",
                  color: "#f5f3ff",
                }}
              >
                مدیریت کاربران
              </AdminNavLink>

              <AdminNavLink
                href="/admin/website-analytics"
                title="آمار و تحلیل بازدید سایت"
                icon="📊"
                style={{
                  ...navBase,
                  border: "1px solid #f97316",
                  backgroundColor: "#1c1917",
                  color: "#fed7aa",
                }}
              >
                آمار سایت
              </AdminNavLink>

              <AdminNavLink
                href="/admin/tickets"
                title="مدیریت تیکت‌ها"
                icon="🎫"
                style={{
                  ...navBase,
                  border: "1px solid #22c55e",
                  backgroundColor: "#064e3b",
                  color: "#dcfce7",
                }}
              >
                مدیریت تیکت‌ها
              </AdminNavLink>

              <AdminNavLink
                href="/admin/announcements"
                title="مدیریت بنرهای همگانی اپ"
                icon="📣"
                style={{
                  ...navBase,
                  border: "1px solid #ea580c",
                  backgroundColor: "#7c2d12",
                  color: "#ffedd5",
                }}
              >
                بنر همگانی
              </AdminNavLink>

              {me.role === "owner" ? (
                <AdminNavLink
                  href="/admin/admins"
                  title="مدیریت ادمین‌ها"
                  icon="🛡️"
                  style={{
                    ...navBase,
                    border: "1px solid #0f766e",
                    backgroundColor: "#0f766e",
                    color: "#ecfeff",
                  }}
                >
                  مدیریت ادمین‌ها
                </AdminNavLink>
              ) : null}

              <AdminNavLink
                href="/admin/profile"
                title="ویرایش پروفایل"
                icon="✏️"
                style={{
                  ...navBase,
                  border: "1px solid #374151",
                  backgroundColor: "#111827",
                  color: "#e5e7eb",
                  fontWeight: 800,
                }}
              >
                ویرایش پروفایل
              </AdminNavLink>

              <div style={{ flex: "0 0 auto" }}>
                <LogoutButton />
              </div>
            </div>
          ) : null}
        </div>

        <style jsx>{`
          .admin-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .admin-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            flex: 1 1 320px;
          }

          .admin-user-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            max-width: 320px;
            flex: 0 1 auto;
          }

          .admin-header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: flex-end;
            flex: 1 1 100%;
            flex-wrap: wrap;
          }

          .admin-nav-label,
          .admin-brand-text {
            display: inline;
          }

          @media (max-width: 768px) {
            .admin-header {
              gap: 10px;
            }

            .admin-header-left {
              width: 100%;
              flex: 1 1 100%;
              justify-content: space-between;
            }

            .admin-user-chip {
              max-width: 120px;
            }

            .admin-header-actions {
              width: 100%;
              flex: 1 1 100%;
              flex-wrap: nowrap;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              padding-bottom: 2px;
            }

            .admin-header-actions > * {
              flex: 0 0 auto;
            }

            .admin-nav-label,
            .admin-brand-text {
              display: none;
            }

            .admin-header-left > a {
              min-width: 0;
              padding: 9px 12px;
            }
          }
        `}</style>
      </header>

      <main style={{ flex: 1, padding: "16px 16px 24px", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}
