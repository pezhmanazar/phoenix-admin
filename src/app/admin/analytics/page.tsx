// src/app/admin/analytics/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

type PelekanStageStat = {
  code: string;
  title: string;
  count: number;
  avgDays: number;
  stuckOver7d: number;
};

type PelekanAnalyticsData = {
  funnel: {
    baselineInProgress: number;
    baselineCompleted: number;
    choosePathUsers: number | null;
    reviewInProgress: number;
    reviewCompleted: number;
    waitingForProUsers: number;
    introCompletedUsers: number;
    introCompletedProUsers: number;
    treatingUsers: number;
    activeTreatmentUsers: number;
  };
  baseline: {
    completedCount: number;
    avgScore: number;
    avgPercent: number;
    levelDistribution: {
      manageable: number;
      moderate: number;
      severe: number;
      unknown: number;
    };
    percentBuckets: {
      "0_30": number;
      "31_60": number;
      "61_80": number;
      "81_100": number;
    };
  };
  treatment: {
    activeUsers: number;
    stageDistribution: PelekanStageStat[];
  };
  stuck: {
    treatmentOver7d: number;
  };
};

type PelekanAnalyticsResponse = {
  ok: boolean;
  data?: PelekanAnalyticsData;
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

function fmtAvgDays(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  if (v < 0) return "0";
  if (v > 999) return "999+";
  return String(Math.round(v * 10) / 10);
}

function stagePercent(users: number, total: number) {
  if (!total || total <= 0) return 0;
  return clamp(Math.round((users / total) * 100), 0, 100);
}

function avgDaysTone(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return {
      color: "#94a3b8",
      bg: "transparent",
      label: "نامشخص",
    };
  }

  if (v >= 21) {
    return {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.10)",
      label: "بحرانی",
    };
  }

  if (v >= 10) {
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.10)",
      label: "متوسط",
    };
  }

  return {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
    label: "عادی",
  };
}

function useViewport() {
  const [width, setWidth] = useState<number>(1200);

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  return { width, isMobile, isTablet, isDesktop };
}

/* -------------------- UI styles -------------------- */
const wrapBase: React.CSSProperties = {
  maxWidth: 1280,
  marginInline: "auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  overflow: "hidden",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "#94a3b8",
  lineHeight: 1.8,
};

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

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  padding: 14,
  minWidth: 0,
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: 800,
};

const statValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 950,
  lineHeight: 1.2,
  wordBreak: "break-word",
};

const statHint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: "#64748b",
  lineHeight: 1.8,
};

const sectionTitle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 900,
  textAlign: "center",
};

const sectionBody: React.CSSProperties = {
  padding: 12,
};

function ResponsiveGrid({
  minWidth,
  gap = 12,
  children,
}: {
  minWidth: number;
  gap?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  fill,
  mobile,
}: {
  label: string;
  value: number;
  total: number;
  fill?: string;
  mobile?: boolean;
}) {
  const p = total ? (value / total) * 100 : 0;
  const w = clamp(p, 0, 100);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "140px 1fr 74px",
        gap: mobile ? 6 : 10,
        alignItems: "center",
        marginTop: 10,
      }}
    >
      {mobile ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#e2e8f0",
                textAlign: "right",
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#cbd5e1",
                whiteSpace: "nowrap",
              }}
            >
              {value} <span style={{ opacity: 0.7 }}>({pct(value, total)})</span>
            </div>
          </div>

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
                background:
                  fill ||
                  "linear-gradient(90deg, rgba(234,88,12,0.35), rgba(124,58,237,0.35))",
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#e2e8f0",
              textAlign: "right",
              minWidth: 0,
            }}
          >
            {label}
          </div>

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
                background:
                  fill ||
                  "linear-gradient(90deg, rgba(234,88,12,0.35), rgba(124,58,237,0.35))",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#cbd5e1",
              textAlign: "left",
              whiteSpace: "nowrap",
            }}
          >
            {value} <span style={{ opacity: 0.7 }}>({pct(value, total)})</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { isMobile, isTablet } = useViewport();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [ticketsTotal, setTicketsTotal] = useState<number>(0);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsUnread, setTicketsUnread] = useState<number>(0);

  const [pelekanLoading, setPelekanLoading] = useState(false);
  const [pelekanErr, setPelekanErr] = useState<string | null>(null);
  const [pelekan, setPelekan] = useState<PelekanAnalyticsData | null>(null);

  const refreshLockRef = useRef(false);

  async function loadAllUsers(): Promise<void> {
    setLoading(true);
    setErr(null);

    try {
      const all: UserRow[] = [];
      let p = 1;
      const per = 200;
      let totalFromApi = 0;

      while (true) {
        const url = `/api/admin/users?page=${p}&limit=${per}&ts=${Date.now()}`;
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
        if (p > 200) break;
      }

      setRows(all);
      setTotal(totalFromApi || all.length);

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

  async function loadTicketStats(): Promise<void> {
    setTicketsLoading(true);

    try {
      const r = await fetch(`/api/admin/tickets?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("bad_ticket_response");

      const j = await r.json();
      if (!j?.ok || !Array.isArray(j.tickets)) {
        throw new Error("ticket_request_failed");
      }

      const allTickets = j.tickets as Array<{ unread?: boolean }>;
      setTicketsTotal(allTickets.length);
      setTicketsUnread(allTickets.filter((t) => !!t.unread).length);
    } catch (e) {
      console.error("loadTicketStats failed", e);
      setTicketsTotal(0);
      setTicketsUnread(0);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadPelekanStats(): Promise<void> {
    setPelekanLoading(true);
    setPelekanErr(null);

    try {
      const r = await fetch(`/api/admin/analytics/pelekan?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("bad_pelekan_response");

      const j = (await r.json()) as PelekanAnalyticsResponse;
      if (!j?.ok || !j.data) throw new Error("pelekan_request_failed");

      setPelekan(j.data);
    } catch (e: any) {
      console.error("loadPelekanStats failed", e);
      setPelekan(null);
      setPelekanErr(String(e?.message || "pelekan_internal_error"));
    } finally {
      setPelekanLoading(false);
    }
  }

  async function handleRefresh() {
    if (refreshLockRef.current) return;

    refreshLockRef.current = true;
    try {
      await Promise.all([loadAllUsers(), loadTicketStats(), loadPelekanStats()]);
    } finally {
      refreshLockRef.current = false;
    }
  }

  useEffect(() => {
    handleRefresh();
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

    const now = Date.now();
    let new7 = 0;
    let new30 = 0;
    let new30Pro = 0;
    let new30Users = 0;
    let new30Free = 0;
    let new30ActivePro = 0;
    let new30Expiring = 0;
    let new30Expired = 0;

    let pro0to3 = 0;
    let pro4to7 = 0;
    let pro8to30 = 0;
    let pro30plus = 0;

    for (const u of rows) {
      const ps = planState(u);

      if (ps === "pro") {
        const dl = daysLeft(u.planExpiresAt || null);
        if (dl !== null && dl > 0) {
          if (dl <= 3) {
            pro0to3 += 1;
          } else if (dl <= 7) {
            pro4to7 += 1;
          } else if (dl <= 30) {
            pro8to30 += 1;
          } else {
            pro30plus += 1;
          }
        }
      }

      byPlan[ps]++;
      byGender[genderKey(u.gender || null)]++;

      if (u.profileCompleted) completed++;

      const cd = safeDate(u.createdAt || null)?.getTime() || 0;
      if (cd) {
        if (cd >= now - 7 * 24 * 3600 * 1000) new7++;

        if (cd >= now - 30 * 24 * 3600 * 1000) {
          new30++;
          new30Users++;

          if (ps === "pro") {
            new30Pro++;
            new30ActivePro++;
          } else if (ps === "expiring") {
            new30Expiring++;
          } else if (ps === "expired") {
            new30Expired++;
          } else {
            new30Free++;
          }
        }
      }
    }

    const completionRate = n ? Math.round((completed / n) * 100) : 0;
    const proRate = n ? Math.round((byPlan.pro / n) * 100) : 0;
    const expiringRate = n ? Math.round((byPlan.expiring / n) * 100) : 0;
    const expiredRate = n ? Math.round((byPlan.expired / n) * 100) : 0;

    return {
      n,
      completed,
      completionRate,
      proRate,
      expiringRate,
      expiredRate,
      pro0to3,
      pro4to7,
      pro8to30,
      pro30plus,
      proExpiringSoon: pro0to3 + pro4to7,
      new30Pro,
      new30Users,
      new30Free,
      new30ActivePro,
      new30Expiring,
      new30Expired,
      new30ProRate: new30Users ? Math.round((new30Pro / new30Users) * 100) : 0,
      byPlan,
      byGender,
      new7,
      new30,
    };
  }, [rows]);

  const isRefreshing = loading || pelekanLoading || ticketsLoading;

  return (
    <div
      style={{
        ...wrapBase,
        paddingInline: isMobile ? 12 : 16,
        paddingTop: isMobile ? 12 : 18,
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "stretch" : "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              ...title,
              fontSize: isMobile ? 20 : 22,
            }}
          >
            آمار و تحلیل
          </h1>

          <div
            style={{
              ...sub,
              fontSize: isMobile ? 11 : 12,
            }}
          >
            {isRefreshing
              ? "در حال دریافت و بروزرسانی داده‌ها…"
              : err
              ? `خطا: ${err}`
              : `کل کاربران: ${stats.n}  •  آخرین بروزرسانی: ${
                  lastUpdatedAt ? fmtFa(lastUpdatedAt) : "—"
                }`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            title={isRefreshing ? "در حال بروزرسانی داده‌ها" : "دریافت مجدد آخرین آمار"}
            style={{
              ...btnPrimary,
              opacity: isRefreshing ? 0.6 : 1,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              flex: isMobile ? 1 : undefined,
              justifyContent: "center",
            }}
          >
            {isRefreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
          </button>

          <div
            style={{
              ...btn,
              cursor: "default",
              opacity: 0.9,
              flex: isMobile ? 1 : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            total(API): <b style={{ marginInlineStart: 6 }}>{total || stats.n}</b>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ResponsiveGrid minWidth={isMobile ? 140 : isTablet ? 220 : 240}>
          <div style={statCard}>
            <div style={statLabel}>کل کاربران</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>{stats.n}</div>
            <div style={statHint}>نمایش بر اساس لیست کاربران (paginate)</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>کاربران جدید</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>{stats.new7}</div>
            <div style={statHint}>۷ روز اخیر • ۳۰ روز اخیر: {stats.new30}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>نرخ تقریبی جذب PRO</div>
            <div
              style={{
                ...statValue,
                fontSize: isMobile ? 22 : 24,
                color:
                  stats.new30ProRate >= 20
                    ? "#22c55e"
                    : stats.new30ProRate >= 10
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {stats.new30ProRate}%
            </div>
            <div style={statHint}>
              از {stats.new30Users} کاربر ۳۰ روز اخیر، {stats.new30Pro} نفر الان PRO هستند
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: 900,
                color: "#94a3b8",
                lineHeight: 1.8,
              }}
            >
              {stats.new30ProRate >= 20
                ? "وضعیت خوب"
                : stats.new30ProRate >= 10
                ? "نیاز به بهبود"
                : "هشدار: جذب PRO پایین است"}
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>تکمیل پروفایل</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
              {stats.completionRate}%
            </div>
            <div style={statHint}>
              کامل: {stats.completed} • ناقص: {Math.max(0, stats.n - stats.completed)}
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>کاربران PRO (فعال)</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>{stats.byPlan.pro}</div>
            <div style={statHint}>
              نزدیک انقضا: {stats.byPlan.expiring} • منقضی: {stats.byPlan.expired}
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>PRO در معرض ریزش</div>
            <div
              style={{
                ...statValue,
                fontSize: isMobile ? 22 : 24,
                color: "#ef4444",
              }}
            >
              {stats.proExpiringSoon}
            </div>
            <div style={statHint}>کاربران PRO فعالی که تا ۷ روز آینده منقضی می‌شوند</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>درصد کاربران PRO</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>{stats.proRate}%</div>
            <div style={statHint}>از کل {stats.n} کاربر</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>نزدیک انقضا</div>
            <div
              style={{
                ...statValue,
                fontSize: isMobile ? 22 : 24,
                color: "#f59e0b",
              }}
            >
              {stats.byPlan.expiring}
            </div>
            <div style={statHint}>{stats.expiringRate}% از کل کاربران</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>منقضی‌شده</div>
            <div
              style={{
                ...statValue,
                fontSize: isMobile ? 22 : 24,
                color: "#f43f5e",
              }}
            >
              {stats.byPlan.expired}
            </div>
            <div style={statHint}>{stats.expiredRate}% از کل کاربران</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>توزیع PRO فعال</div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, lineHeight: 2 }}>
              <div>
                ۰ تا ۳ روز: <span style={{ color: "#f97316" }}>{stats.pro0to3}</span>
              </div>
              <div>
                ۴ تا ۷ روز: <span style={{ color: "#f59e0b" }}>{stats.pro4to7}</span>
              </div>
              <div>
                ۸ تا ۳۰ روز: <span style={{ color: "#22c55e" }}>{stats.pro8to30}</span>
              </div>
              <div>
                ۳۰+ روز: <span style={{ color: "#38bdf8" }}>{stats.pro30plus}</span>
              </div>
            </div>
            <div style={statHint}>فقط کاربران PRO فعال</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>کل تیکت‌ها</div>
            <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>{ticketsTotal}</div>
            <div style={statHint}>تعداد کل پیام‌ها/درخواست‌های پشتیبانی ثبت‌شده</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>تیکت‌های خوانده‌نشده</div>
            <div
              style={{
                ...statValue,
                fontSize: isMobile ? 22 : 24,
                color: ticketsUnread > 0 ? "#ef4444" : "#22c55e",
              }}
            >
              {ticketsUnread}
            </div>
            <div style={statHint}>
              {ticketsUnread > 0
                ? "نیازمند رسیدگی فوری توسط درمانگر یا ادمین"
                : "فعلاً مورد فوری وجود ندارد"}
            </div>
          </div>
        </ResponsiveGrid>
      </div>

      <div style={{ marginTop: 14 }}>
        <ResponsiveGrid minWidth={isMobile ? 260 : 320}>
          <div style={card}>
            <div style={sectionTitle}>تفکیک پلن</div>
            <div style={sectionBody}>
              <BarRow label="FREE" value={stats.byPlan.free} total={stats.n} mobile={isMobile} />
              <BarRow label="PRO" value={stats.byPlan.pro} total={stats.n} mobile={isMobile} />
              <BarRow
                label="نزدیک انقضا"
                value={stats.byPlan.expiring}
                total={stats.n}
                mobile={isMobile}
              />
              <BarRow
                label="منقضی"
                value={stats.byPlan.expired}
                total={stats.n}
                mobile={isMobile}
              />

              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.8,
                }}
              >
                {"تعریف‌ها: expiring = ۳ روز آخر • expired = ≤ 0 روز • pro = فعال"}
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={sectionTitle}>تفکیک جنسیت</div>
            <div style={sectionBody}>
              <BarRow label="مرد" value={stats.byGender.male} total={stats.n} mobile={isMobile} />
              <BarRow
                label="زن"
                value={stats.byGender.female}
                total={stats.n}
                mobile={isMobile}
              />
              <BarRow
                label="سایر"
                value={stats.byGender.other}
                total={stats.n}
                mobile={isMobile}
              />
              <BarRow
                label="نامشخص"
                value={stats.byGender.unknown}
                total={stats.n}
                mobile={isMobile}
              />

              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.8,
                }}
              >
                اگر gender خالی باشد: «نامشخص» حساب می‌شود.
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={sectionTitle}>جذب PRO در ۳۰ روز اخیر</div>
            <div style={sectionBody}>
              <BarRow
                label="FREE"
                value={stats.new30Free}
                total={stats.new30Users}
                mobile={isMobile}
              />
              <BarRow
                label="PRO فعال"
                value={stats.new30ActivePro}
                total={stats.new30Users}
                mobile={isMobile}
              />
              <BarRow
                label="نزدیک انقضا"
                value={stats.new30Expiring}
                total={stats.new30Users}
                mobile={isMobile}
              />
              <BarRow
                label="منقضی"
                value={stats.new30Expired}
                total={stats.new30Users}
                mobile={isMobile}
              />

              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.8,
                }}
              >
                از بین کاربران ثبت‌نام‌کرده ۳۰ روز اخیر، وضعیت فعلی پلن نمایش داده می‌شود.
              </div>
            </div>
          </div>
        </ResponsiveGrid>
      </div>

      <div style={{ marginTop: 14, ...card }}>
        <div style={sectionTitle}>توزیع کاربران PRO فعال بر اساس روز باقی‌مانده</div>
        <div style={sectionBody}>
          <BarRow label="۰ تا ۳ روز" value={stats.pro0to3} total={stats.byPlan.pro} mobile={isMobile} />
          <BarRow label="۴ تا ۷ روز" value={stats.pro4to7} total={stats.byPlan.pro} mobile={isMobile} />
          <BarRow label="۸ تا ۳۰ روز" value={stats.pro8to30} total={stats.byPlan.pro} mobile={isMobile} />
          <BarRow label="۳۰+ روز" value={stats.pro30plus} total={stats.byPlan.pro} mobile={isMobile} />

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "#64748b",
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            فقط بین کاربران PRO فعال محاسبه شده، نه نزدیک انقضا و نه منقضی‌شده.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, ...card }}>
        <div style={sectionTitle}>آمار پلکان درمان</div>
        <div style={sectionBody}>
          {pelekanLoading ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
              در حال دریافت آمار پلکان…
            </div>
          ) : pelekanErr ? (
            <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", lineHeight: 1.8 }}>
              خطا در دریافت آمار پلکان: {pelekanErr}
            </div>
          ) : !pelekan ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
              داده‌ای برای آمار پلکان موجود نیست.
            </div>
          ) : (
            <>
              <ResponsiveGrid minWidth={isMobile ? 220 : 260}>
                <div style={statCard}>
                  <div style={statLabel}>ورود به درمان</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.treatingUsers}
                  </div>
                  <div style={statHint}>کاربران یکتایی که وارد درمان پلکان شده‌اند</div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>درمان فعال</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.activeTreatmentUsers}
                  </div>
                  <div style={statHint}>
                    کاربران فعالی که اکنون در یکی از مراحل درمان هستند
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>baseline تکمیل‌شده</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.baseline.completedCount}
                  </div>
                  <div style={statHint}>
                    تعداد baselineهای تکمیل‌شده • سطح‌بندی: ۰–۹ قابل‌مدیریت، ۱۰–۱۹ متوسط،
                    ۲۰–۳۱ شدید
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>میانگین baseline</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.baseline.avgScore}
                  </div>
                  <div style={statHint}>
                    میانگین نمره: {pelekan.baseline.avgPercent}% از حداکثر ۳۱
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>review تکمیل‌شده</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.reviewCompleted}
                  </div>
                  <div style={statHint}>review های تکمیل‌شده یا unlock شده</div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>FREE پس از ویس شروع</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.waitingForProUsers}
                  </div>
                  <div style={statHint}>
                    کاربران FREE که ویس شروع پلکان را کامل کرده‌اند اما هنوز PRO نشده‌اند
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>تکمیل ویس شروع</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.introCompletedUsers}
                  </div>
                  <div style={statHint}>
                    تعداد کل کاربرانی که ویس شروع پلکان را کامل کرده‌اند
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>PRO پس از ویس شروع</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.introCompletedProUsers}
                  </div>
                  <div style={statHint}>
                    از بین کاربران تکمیل‌کننده ویس شروع، تعداد کاربرانی که اکنون PRO هستند
                  </div>
                </div>

                <div style={statCard}>
                  <div style={statLabel}>baseline در جریان</div>
                  <div style={{ ...statValue, fontSize: isMobile ? 22 : 24 }}>
                    {pelekan.funnel.baselineInProgress}
                  </div>
                  <div style={statHint}>
                    کاربرانی که baseline را شروع کرده‌اند اما کامل نکرده‌اند
                  </div>
                </div>
              </ResponsiveGrid>

              <div style={{ marginTop: 12 }}>
                <ResponsiveGrid minWidth={isMobile ? 260 : 360}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 14,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      توزیع حرفه‌ای baseline
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "#94a3b8",
                        textAlign: "center",
                        lineHeight: 1.8,
                      }}
                    >
                      نسبت هر سطح از بین baselineهای تکمیل‌شده
                    </div>

                    <BarRow
                      label="قابل‌مدیریت (۰–۹)"
                      value={pelekan.baseline.levelDistribution.manageable}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(34,197,94,0.65), rgba(74,222,128,0.55))"
                      mobile={isMobile}
                    />
                    <BarRow
                      label="متوسط (۱۰–۱۹)"
                      value={pelekan.baseline.levelDistribution.moderate}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(245,158,11,0.65), rgba(251,191,36,0.55))"
                      mobile={isMobile}
                    />
                    <BarRow
                      label="شدید (۲۰–۳۱)"
                      value={pelekan.baseline.levelDistribution.severe}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(239,68,68,0.65), rgba(248,113,113,0.55))"
                      mobile={isMobile}
                    />

                    {pelekan.baseline.levelDistribution.unknown > 0 ? (
                      <BarRow
                        label="نامشخص"
                        value={pelekan.baseline.levelDistribution.unknown}
                        total={pelekan.baseline.completedCount}
                        fill="linear-gradient(90deg, rgba(148,163,184,0.65), rgba(100,116,139,0.55))"
                        mobile={isMobile}
                      />
                    ) : null}
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 14,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      توزیع درصد baseline
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "#94a3b8",
                        textAlign: "center",
                        lineHeight: 1.8,
                      }}
                    >
                      این بخش مکمل است؛ معیار اصلی تصمیم‌گیری همچنان سه سطح baseline است
                    </div>

                    <BarRow
                      label="۰ تا ۳۰٪"
                      value={pelekan.baseline.percentBuckets["0_30"]}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(34,197,94,0.55), rgba(56,189,248,0.45))"
                      mobile={isMobile}
                    />
                    <BarRow
                      label="۳۱ تا ۶۰٪"
                      value={pelekan.baseline.percentBuckets["31_60"]}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(245,158,11,0.55), rgba(234,179,8,0.45))"
                      mobile={isMobile}
                    />
                    <BarRow
                      label="۶۱ تا ۸۰٪"
                      value={pelekan.baseline.percentBuckets["61_80"]}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(249,115,22,0.55), rgba(239,68,68,0.45))"
                      mobile={isMobile}
                    />
                    <BarRow
                      label="۸۱ تا ۱۰۰٪"
                      value={pelekan.baseline.percentBuckets["81_100"]}
                      total={pelekan.baseline.completedCount}
                      fill="linear-gradient(90deg, rgba(239,68,68,0.65), rgba(190,24,93,0.55))"
                      mobile={isMobile}
                    />
                  </div>
                </ResponsiveGrid>
              </div>

              <div style={{ marginTop: 12 }}>
                {(pelekan.treatment.stageDistribution || []).length === 0 ? (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: "16px 12px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#94a3b8",
                    }}
                  >
                    هنوز داده‌ای برای مراحل پلکان ثبت نشده است.
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      overflowX: "auto",
                      overflowY: "hidden",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <div style={{ minWidth: 680 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 0.7fr 0.7fr 1fr",
                          backgroundColor: "rgba(255,255,255,0.04)",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          padding: "10px 12px",
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#cbd5e1",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>مرحله</div>
                        <div style={{ textAlign: "center" }}>تعداد</div>
                        <div style={{ textAlign: "center" }}>میانگین روز</div>
                        <div style={{ textAlign: "center" }}>شدت</div>
                      </div>

                      {(pelekan.treatment.stageDistribution || []).map((s, index) => {
                        const sp = stagePercent(s.count, pelekan.treatment.activeUsers);
                        const tone = avgDaysTone(s.avgDays);

                        return (
                          <div
                            key={s.code}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1.2fr 0.7fr 0.7fr 1fr",
                              padding: "10px 12px",
                              borderBottom:
                                index === (pelekan.treatment.stageDistribution || []).length - 1
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.06)",
                              fontSize: 12,
                              color: "#e2e8f0",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ textAlign: "right", fontWeight: 900 }}>{s.title}</div>

                            <div style={{ textAlign: "center" }}>{s.count}</div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <div
                                style={{
                                  minWidth: 72,
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  textAlign: "center",
                                  fontWeight: 900,
                                  color: tone.color,
                                  backgroundColor: tone.bg,
                                  border: `1px solid ${
                                    tone.bg === "transparent"
                                      ? "rgba(255,255,255,0.08)"
                                      : tone.bg
                                  }`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span>{fmtAvgDays(s.avgDays)}</span>
                                <span style={{ fontSize: 10, opacity: 0.9 }}>{tone.label}</span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 999,
                                  backgroundColor: "rgba(255,255,255,0.06)",
                                  overflow: "hidden",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${sp}%`,
                                    borderRadius: 999,
                                    background:
                                      sp >= 60
                                        ? "linear-gradient(90deg, #ef4444, #f97316)"
                                        : sp >= 30
                                        ? "linear-gradient(90deg, #f59e0b, #facc15)"
                                        : "linear-gradient(90deg, #22c55e, #38bdf8)",
                                  }}
                                />
                              </div>

                              <div
                                style={{
                                  minWidth: 38,
                                  fontSize: 11,
                                  fontWeight: 900,
                                  color: "#cbd5e1",
                                  textAlign: "left",
                                }}
                              >
                                {sp}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <ResponsiveGrid minWidth={isMobile ? 260 : 320} gap={10}>
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        padding: "10px 12px",
                        backgroundColor: "rgba(234,88,12,0.06)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#fdba74", fontWeight: 900 }}>
                        کاربران گیرکرده در درمان
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 20,
                          fontWeight: 950,
                          color: "#fff",
                        }}
                      >
                        {pelekan.stuck.treatmentOver7d}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: "#94a3b8",
                          lineHeight: 1.7,
                        }}
                      >
                        تعداد کاربران فعالی که بیش از ۷ روز در مرحله فعلی درمان مانده‌اند.
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        padding: "10px 12px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 900 }}>
                        نکته محاسباتی
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "#94a3b8",
                          lineHeight: 1.9,
                        }}
                      >
                        توزیع مراحل فقط کاربران فعال درمان را نشان می‌دهد. شاخص «منتظر خرید
                        اشتراک» بر اساس کاربران FREE محاسبه می‌شود که ویس شروع پلکان را کامل
                        کرده‌اند اما هنوز PRO نشده‌اند.
                      </div>
                    </div>
                  </ResponsiveGrid>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
