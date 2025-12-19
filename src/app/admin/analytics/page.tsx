// src/app/admin/analytics/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  phone: string;
  fullName: string;
  gender?: string | null;
  birthDate?: string | null;
  plan: "free" | "pro" | string;
  planExpiresAt?: string | null;
  profileCompleted?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type UsersResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  users: UserRow[];
};

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysLeft(expiresAt?: string | null) {
  const d = safeDate(expiresAt);
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (24 * 3600 * 1000));
}

function planState(u: UserRow) {
  if (u.plan !== "pro") return "free" as const;
  const dl = daysLeft(u.planExpiresAt || null);
  if (dl === null) return "pro" as const;
  if (dl <= 0) return "expired" as const;
  if (dl <= 3) return "expiring" as const;
  return "pro" as const;
}

function genderKey(g?: string | null) {
  const x = String(g || "").toLowerCase();
  if (x === "male" || x === "m") return "male" as const;
  if (x === "female" || x === "f") return "female" as const;
  if (!x) return "unknown" as const;
  return "other" as const;
}

function fmtFa(v?: string | null) {
  const d = safeDate(v);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

/* -------------------- UI styles (match your admin vibe) -------------------- */
const wrap: React.CSSProperties = { maxWidth: 1200, marginInline: "auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  overflow: "hidden",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const title: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 950 };

const sub: React.CSSProperties = { marginTop: 6, fontSize: 12, color: "#94a3b8" };

const btn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid #334155",
  backgroundColor: "#0b1220",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #7c2d12",
  backgroundColor: "#ea580c",
  color: "#fff",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  padding: 14,
};

const statLabel: React.CSSProperties = { fontSize: 12, color: "#94a3b8", fontWeight: 800 };
const statValue: React.CSSProperties = { marginTop: 6, fontSize: 24, fontWeight: 950 };
const statHint: React.CSSProperties = { marginTop: 6, fontSize: 11, color: "#64748b", lineHeight: 1.6 };

const sectionTitle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 900,
  textAlign: "center",
};

const sectionBody: React.CSSProperties = { padding: 12 };

function BarRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const p = total ? (value / total) * 100 : 0;
  const w = clamp(p, 0, 100);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 70px", gap: 10, alignItems: "center", marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#e2e8f0", textAlign: "right" }}>{label}</div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(234,88,12,0.35), rgba(124,58,237,0.35))",
          }}
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#cbd5e1", textAlign: "left" }}>
        {value} <span style={{ opacity: 0.7 }}>({pct(value, total)})</span>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Optional: allow filtering by q same as users endpoint (later you can wire UI)
  const [q] = useState<string>("");

  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  async function loadAllUsers(): Promise<void> {
    setLoading(true);
    setErr(null);

    try {
      const all: UserRow[] = [];
      let p = 1;
      const per = 200; // keep it safe
      let totalFromApi = 0;

      while (true) {
        const url = `/api/admin/users?q=${encodeURIComponent(q || "")}&page=${p}&limit=${per}&ts=${Date.now()}`;
        const r = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("bad_response");
        const j = (await r.json()) as UsersResponse;
        if (!j?.ok) throw new Error("request_failed");

        totalFromApi = j.total || totalFromApi;
        all.push(...(j.users || []));

        if ((j.users || []).length === 0) break;
        if (all.length >= (j.total || 0)) break;

        p++;
        if (p > 200) break; // safety
      }

      setRows(all);
      setTotal(totalFromApi || all.length);

      // last updated: max(updatedAt)
      const maxUpdated = all
        .map((u) => safeDate(u.updatedAt || null)?.getTime() || 0)
        .reduce((a, b) => Math.max(a, b), 0);
      setLastUpdatedAt(maxUpdated ? new Date(maxUpdated).toISOString() : null);
    } catch (e: any) {
      setErr(String(e?.message || "internal_error"));
      setRows([]);
      setTotal(0);
      setLastUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const n = rows.length;

    const byPlan = {
      free: 0,
      pro: 0,
      expiring: 0,
      expired: 0,
    };

    const byGender = {
      male: 0,
      female: 0,
      other: 0,
      unknown: 0,
    };

    let completed = 0;

    // growth last 7/30 days
    const now = Date.now();
    let new7 = 0;
    let new30 = 0;

    for (const u of rows) {
      const ps = planState(u);
      byPlan[ps]++;

      const gk = genderKey(u.gender || null);
      byGender[gk]++;

      if (u.profileCompleted) completed++;

      const cd = safeDate(u.createdAt || null)?.getTime() || 0;
      if (cd) {
        if (cd >= now - 7 * 24 * 3600 * 1000) new7++;
        if (cd >= now - 30 * 24 * 3600 * 1000) new30++;
      }
    }

    const completionRate = n ? Math.round((completed / n) * 100) : 0;

    return {
      n,
      completed,
      completionRate,
      byPlan,
      byGender,
      new7,
      new30,
    };
  }, [rows]);

  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>آمار و تحلیل</h1>
          <div style={sub}>
            {loading
              ? "در حال دریافت داده‌ها…"
              : err
              ? `خطا: ${err}`
              : `کل کاربران: ${stats.n}  •  آخرین بروزرسانی: ${lastUpdatedAt ? fmtFa(lastUpdatedAt) : "—"}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={loadAllUsers} disabled={loading} style={btnPrimary}>
            بروزرسانی
          </button>
          <div style={{ ...btn, cursor: "default", opacity: 0.9 }}>
            total(API): <b style={{ marginInlineStart: 6 }}>{total || stats.n}</b>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ marginTop: 14 }}>
        <div style={grid}>
          <div style={statCard}>
            <div style={statLabel}>کل کاربران</div>
            <div style={statValue}>{stats.n}</div>
            <div style={statHint}>نمایش بر اساس لیست کاربران (paginate)</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>کاربران جدید</div>
            <div style={statValue}>{stats.new7}</div>
            <div style={statHint}>۷ روز اخیر • ۳۰ روز اخیر: {stats.new30}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>تکمیل پروفایل</div>
            <div style={statValue}>{stats.completionRate}%</div>
            <div style={statHint}>
              کامل: {stats.completed} • ناقص: {Math.max(0, stats.n - stats.completed)}
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>کاربران PRO (فعال)</div>
            <div style={statValue}>{stats.byPlan.pro}</div>
            <div style={statHint}>
              نزدیک انقضا: {stats.byPlan.expiring} • منقضی: {stats.byPlan.expired}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Plan breakdown */}
        <div style={card}>
          <div style={sectionTitle}>تفکیک پلن</div>
          <div style={sectionBody}>
            <BarRow label="FREE" value={stats.byPlan.free} total={stats.n} />
            <BarRow label="PRO" value={stats.byPlan.pro} total={stats.n} />
            <BarRow label="نزدیک انقضا" value={stats.byPlan.expiring} total={stats.n} />
            <BarRow label="منقضی" value={stats.byPlan.expired} total={stats.n} />

            <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 1.8 }}>
             {"تعریف‌ها: expiring = ۳ روز آخر • expired = ≤ 0 روز • pro = فعال"}
            </div>
          </div>
        </div>

        {/* Gender breakdown */}
        <div style={card}>
          <div style={sectionTitle}>تفکیک جنسیت</div>
          <div style={sectionBody}>
            <BarRow label="مرد" value={stats.byGender.male} total={stats.n} />
            <BarRow label="زن" value={stats.byGender.female} total={stats.n} />
            <BarRow label="سایر" value={stats.byGender.other} total={stats.n} />
            <BarRow label="نامشخص" value={stats.byGender.unknown} total={stats.n} />

            <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 1.8 }}>
              اگر gender خالی باشد: «نامشخص» حساب می‌شود.
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions (Phase 2 hooks) */}
      <div style={{ marginTop: 12, ...card }}>
        <div style={sectionTitle}>پیشنهادهای فاز بعد (فعلاً فقط یادداشت)</div>
        <div style={{ padding: 12, fontSize: 12, color: "#cbd5e1", lineHeight: 2 }}>
          <div>• قیف مراحل (۷ مرحله) + نرخ ریزش در هر مرحله</div>
          <div>• اثر بنرها: seen/dismiss + نرخ تبدیل به PRO بعد از بنر</div>
          <div>• Cohort retention: ۷/۱۴/۳۰ روز</div>
          <div>• نرخ تبدیل: free → pro بر اساس روز/هفته</div>
        </div>
      </div>
    </div>
  );
}