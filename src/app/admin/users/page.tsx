// src/app/admin/users/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AdminUser = {
  id: string;
  phone: string;
  fullName: string;
  plan: "free" | "pro" | string;
  planExpiresAt: string | null;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponseOk = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  users: AdminUser[];
};

type UsersResponseFail = {
  ok: false;
  error: string;
};

type UsersResponse = UsersResponseOk | UsersResponseFail;

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("fa-IR");
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const page = Math.max(1, Number(sp.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(5, Number(sp.get("limit") || "30") || 30));
  const q = (sp.get("q") || "").trim();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<UsersResponseOk | null>(null);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  // fetch users
  useEffect(() => {
    let alive = true;

    async function run() {
      setBusy(true);
      setErr(null);

      try {
        const url = `/api/admin/users?limit=${encodeURIComponent(limit)}&page=${encodeURIComponent(
          page
        )}&ts=${Date.now()}`;

        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          console.log("[users] non-json:", text.slice(0, 400));
          throw new Error(`bad_response_${res.status}`);
        }

        const json = (await res.json().catch(() => null)) as UsersResponse | null;
        if (!json || json.ok !== true) {
          throw new Error((json as UsersResponseFail | null)?.error || "request_failed");
        }

        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        const msg = String(e?.message || "internal_error");
        setErr(msg);
        setData(null);
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [page, limit]);

  // client-side search (روی همین page)
  const visibleUsers = useMemo(() => {
    const users = data?.users || [];
    if (!q) return users;
    const qq = q.toLowerCase();
    return users.filter((u) => {
      const fullName = (u.fullName || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const plan = (u.plan || "").toLowerCase();
      return fullName.includes(qq) || phone.includes(qq) || plan.includes(qq);
    });
  }, [data, q]);

  function setQuery(next: { page?: number; limit?: number; q?: string }) {
    const params = new URLSearchParams(sp.toString());
    if (next.page != null) params.set("page", String(next.page));
    if (next.limit != null) params.set("limit", String(next.limit));
    if (next.q != null) {
      const v = next.q.trim();
      if (v) params.set("q", v);
      else params.delete("q");
    }
    router.replace(`/admin/users?${params.toString()}`);
  }

  return (
    <div style={{ padding: "18px 18px 40px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>مدیریت کاربران</h1>

        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQuery({ q: e.target.value, page: 1 })}
            placeholder="جستجو: نام، شماره، پلن…"
            style={{
              width: 260,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              outline: "none",
              fontSize: 13,
            }}
          />

          <select
            value={limit}
            onChange={(e) => setQuery({ limit: Number(e.target.value) || 30, page: 1 })}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              outline: "none",
              fontSize: 13,
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            onClick={() => setQuery({ page })}
            disabled={busy}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: busy ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: busy ? "default" : "pointer",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {busy ? "در حال دریافت…" : "رفرش"}
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Header small stats */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span>page: {page}</span>
          <span>limit: {limit}</span>
          <span style={{ marginInlineStart: "auto" }}>
            total: {data?.total ?? "—"} (pages: {totalPages})
          </span>
        </div>

        {/* Error */}
        {err && (
          <div style={{ padding: 12, color: "#f87171", fontSize: 12 }}>
            خطا: {err}
          </div>
        )}

        {/* Table */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: "right" }}>
                {["نام", "شماره", "پلن", "انقضا", "پروفایل", "ساخته‌شده", "اقدامات"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.75)",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!data && !busy && !err && (
                <tr>
                  <td colSpan={7} style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>
                    داده‌ای موجود نیست.
                  </td>
                </tr>
              )}

              {busy && !data && (
                <tr>
                  <td colSpan={7} style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>
                    در حال دریافت لیست کاربران…
                  </td>
                </tr>
              )}

              {(visibleUsers || []).map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 13 }}>
                    {u.fullName?.trim() ? u.fullName : <span style={{ opacity: 0.6 }}>—</span>}
                    <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{u.id}</div>
                  </td>

                  <td style={{ padding: "10px 12px", fontSize: 13, direction: "ltr" }}>
                    {u.phone || "—"}
                  </td>

                  <td style={{ padding: "10px 12px", fontSize: 13 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        fontWeight: 800,
                      }}
                    >
                      {u.plan}
                    </span>
                  </td>

                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{fmtDate(u.planExpiresAt)}</td>

                  <td style={{ padding: "10px 12px", fontSize: 12 }}>
                    {u.profileCompleted ? "✅ کامل" : "⚠️ ناقص"}
                  </td>

                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{fmtDate(u.createdAt)}</td>

                  <td style={{ padding: "10px 12px", fontSize: 12, whiteSpace: "nowrap" }}>
                    <button
                      disabled
                      title="اکشن‌ها در قدم بعدی بعد از تایید Routeهای بک‌اند فعال میشن."
                      style={{
                        padding: "7px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.55)",
                        cursor: "not-allowed",
                        fontWeight: 800,
                      }}
                    >
                      اکشن‌ها (بعداً)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            نمایش: {visibleUsers.length} از {data?.users?.length ?? 0} (روی همین صفحه)
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setQuery({ page: 1 })}
              disabled={busy || page <= 1}
              style={pagerBtnStyle(busy || page <= 1)}
            >
              اول
            </button>

            <button
              onClick={() => setQuery({ page: page - 1 })}
              disabled={busy || page <= 1}
              style={pagerBtnStyle(busy || page <= 1)}
            >
              قبلی
            </button>

            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              صفحه {page} از {totalPages}
            </span>

            <button
              onClick={() => setQuery({ page: Math.min(totalPages, page + 1) })}
              disabled={busy || page >= totalPages}
              style={pagerBtnStyle(busy || page >= totalPages)}
            >
              بعدی
            </button>

            <button
              onClick={() => setQuery({ page: totalPages })}
              disabled={busy || page >= totalPages}
              style={pagerBtnStyle(busy || page >= totalPages)}
            >
              آخر
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.65, lineHeight: 1.8 }}>
        نکته: جستجو فعلاً روی داده‌های همین صفحه انجام می‌شود. اگر جستجوی سراسری می‌خواهی،
        باید در بک‌اند پارامتر <code>q</code> را به <code>/api/admin/users</code> اضافه کنیم.
      </div>
    </div>
  );
}

function pagerBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: disabled ? "default" : "pointer",
    fontWeight: 900,
    fontSize: 12,
    opacity: disabled ? 0.55 : 1,
  };
}