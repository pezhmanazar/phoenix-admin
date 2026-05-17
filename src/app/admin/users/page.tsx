// src/app/admin/users/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type BaselineLevel = "manageable" | "moderate" | "severe" | "unknown";

type UserRow = {
  id: string;
  phone: string;
  fullName: string;
  gender?: string | null;
  birthDate?: string | null;
  plan: "free" | "pro" | "vip" | string;
  planExpiresAt?: string | null;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;

  baselineScore?: number | null;
  baselineLevel?: BaselineLevel | null;
  treatmentStartedAt?: string | null;
  introAudioCompletedAt?: string | null;
  waitingForPro?: boolean;
  currentStageCode?: string | null;
  currentStageTitle?: string | null;
};

type UsersResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  users: UserRow[];
};

type BusyMap = Record<string, boolean>;

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function calcAge(birthDate?: string | null) {
  const d = safeDate(birthDate);
  if (!d) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (!Number.isFinite(age) || age < 0 || age > 120) return "—";
  return String(age);
}

function genderFa(g?: string | null) {
  const x = String(g || "").toLowerCase();
  if (x === "male" || x === "m") return "مرد";
  if (x === "female" || x === "f") return "زن";
  if (!x) return "—";
  return "سایر";
}

function daysLeft(expiresAt?: string | null) {
  const d = safeDate(expiresAt);
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (24 * 3600 * 1000));
}

function fmtFaDate(v?: string | null) {
  const d = safeDate(v);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function planState(u: UserRow) {
  if (u.plan !== "pro" && u.plan !== "vip") return "free";
  const dl = daysLeft(u.planExpiresAt || null);
  if (dl === null) return "pro";
  if (dl <= 0) return "expired";
  if (dl <= 3) return "expiring";
  return "pro";
}

function baselineLevelFa(level?: BaselineLevel | null) {
  if (level === "manageable") return "خفیف";
  if (level === "moderate") return "متوسط";
  if (level === "severe") return "شدید";
  return "نامشخص";
}

function baselineLevelColor(level?: BaselineLevel | null) {
  if (level === "manageable") {
    return { bg: "#052e16", border: "#16a34a", color: "#bbf7d0" };
  }
  if (level === "moderate") {
    return { bg: "#3b2a0a", border: "#f59e0b", color: "#fde68a" };
  }
  if (level === "severe") {
    return { bg: "#3f0a0a", border: "#ef4444", color: "#fecaca" };
  }
  return { bg: "#0b1220", border: "#475569", color: "#cbd5e1" };
}

function Pill({
  text,
  bg,
  border,
  color,
}: {
  text: string;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function PlanBadge({ u }: { u: UserRow }) {
  const st = planState(u);
  if (st === "pro") {
    return <Pill text={u.plan === "vip" ? "VIP" : "PRO"} bg="#052e16" border="#16a34a" color="#bbf7d0" />;
  }
  if (st === "expiring") {
    return <Pill text="نزدیک انقضا" bg="#3b1d0a" border="#f97316" color="#ffedd5" />;
  }
  if (st === "expired") {
    return <Pill text="منقضی" bg="#3f0a0a" border="#ef4444" color="#fecaca" />;
  }
  return <Pill text="FREE" bg="#0b1220" border="#374151" color="#e5e7eb" />;
}

function BaselineBadge({ level }: { level?: BaselineLevel | null }) {
  const c = baselineLevelColor(level);
  return <Pill text={baselineLevelFa(level)} bg={c.bg} border={c.border} color={c.color} />;
}

function buildCsv(rows: UserRow[]) {
  const headers = [
    "id",
    "phone",
    "fullName",
    "gender",
    "age",
    "plan",
    "planExpiresAt",
    "daysLeft",
    "baselineScore",
    "baselineLevel",
    "treatmentStartedAt",
    "introAudioCompletedAt",
    "waitingForPro",
    "currentStageTitle",
    "profileCompleted",
    "createdAt",
    "updatedAt",
  ];

  const escape = (v: any) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((u) =>
      [
        u.id,
        u.phone,
        u.fullName || "",
        genderFa(u.gender || null),
        calcAge(u.birthDate || null),
        planState(u),
        u.planExpiresAt || "",
        daysLeft(u.planExpiresAt || null) ?? "",
        u.baselineScore ?? "",
        baselineLevelFa(u.baselineLevel || "unknown"),
        u.treatmentStartedAt || "",
        u.introAudioCompletedAt || "",
        u.waitingForPro ? "true" : "false",
        u.currentStageTitle || "",
        u.profileCompleted ? "true" : "false",
        u.createdAt || "",
        u.updatedAt || "",
      ]
        .map(escape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}

export default function AdminUsersPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const q0 = sp.get("q") || "";
  const page0 = Number(sp.get("page") || "1") || 1;
  const limit0 = Number(sp.get("limit") || "30") || 30;

  const filter0 = (sp.get("filter") as "all" | "pro" | "free" | "expired" | "expiring") || "all";
  const sort0 =
    (sp.get("sort") as "created_desc" | "created_asc" | "expires_asc" | "expires_desc") || "created_desc";

  const baselineLevel0 = (sp.get("baselineLevel") as BaselineLevel | "all") || "all";
  const hasBaseline0 = (sp.get("hasBaseline") as "all" | "true" | "false") || "all";
  const hasTreatment0 = (sp.get("hasTreatment") as "all" | "true" | "false") || "all";
  const currentStageCode0 = sp.get("currentStageCode") || "";
  const waitingForPro0 = (sp.get("waitingForPro") as "all" | "true" | "false") || "all";

  const [q, setQ] = useState(q0);
  const [page, setPage] = useState(page0);
  const [limit, setLimit] = useState(limit0);

  const [filter, setFilter] = useState<"all" | "pro" | "free" | "expired" | "expiring">(filter0);
  const [sort, setSort] = useState<"created_desc" | "created_asc" | "expires_asc" | "expires_desc">(sort0);

  const [baselineLevel, setBaselineLevel] = useState<BaselineLevel | "all">(baselineLevel0);
  const [hasBaseline, setHasBaseline] = useState<"all" | "true" | "false">(hasBaseline0);
  const [hasTreatment, setHasTreatment] = useState<"all" | "true" | "false">(hasTreatment0);
  const [currentStageCode, setCurrentStageCode] = useState(currentStageCode0);
  const [waitingForPro, setWaitingForPro] = useState<"all" | "true" | "false">(waitingForPro0);

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [busy, setBusy] = useState<BusyMap>({});
  const [modal, setModal] = useState<null | { user: UserRow }>(null);
  const [days, setDays] = useState<number>(30);

  function syncUrl(
    next?: Partial<{
      q: string;
      page: number;
      limit: number;
      filter: string;
      sort: string;
      baselineLevel: string;
      hasBaseline: string;
      hasTreatment: string;
      waitingForPro: string;
      currentStageCode: string;   
    }>
  ) {
    const params = new URLSearchParams(sp.toString());

    const nq = next?.q ?? q;
    const np = next?.page ?? page;
    const nl = next?.limit ?? limit;
    const nf = next?.filter ?? filter;
    const ns = next?.sort ?? sort;
    const nbl = next?.baselineLevel ?? baselineLevel;
    const nhb = next?.hasBaseline ?? hasBaseline;
    const nht = next?.hasTreatment ?? hasTreatment;
    const nwp = next?.waitingForPro ?? waitingForPro;
    const nsc = next?.currentStageCode ?? currentStageCode;

    if (nq) params.set("q", nq);
    else params.delete("q");

    params.set("page", String(np));
    params.set("limit", String(nl));

    if (nf && nf !== "all") params.set("filter", nf);
    else params.delete("filter");

    if (ns && ns !== "created_desc") params.set("sort", ns);
    else params.delete("sort");

    if (nbl && nbl !== "all") params.set("baselineLevel", nbl);
    else params.delete("baselineLevel");

    if (nhb && nhb !== "all") params.set("hasBaseline", nhb);
    else params.delete("hasBaseline");

    if (nht && nht !== "all") params.set("hasTreatment", nht);
    else params.delete("hasTreatment");

    if (nwp && nwp !== "all") params.set("waitingForPro", nwp);
    else params.delete("waitingForPro");

    if (nsc) params.set("currentStageCode", nsc);
    else params.delete("currentStageCode");

    router.replace(`/admin/users?${params.toString()}`);
  }

  function applySearch() {
    const cleaned = (q || "").trim();
    setPage(1);
    syncUrl({ q: cleaned, page: 1 });
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const params = new URLSearchParams();
      if (q0) params.set("q", q0);
      params.set("page", String(page0));
      params.set("limit", String(limit0));

      if (filter0 !== "all") {
        if (filter0 === "pro" || filter0 === "free" || filter0 === "expired") {
          params.set("plan", filter0);
        }
      }

      if (baselineLevel0 !== "all") params.set("baselineLevel", baselineLevel0);
      if (hasBaseline0 !== "all") params.set("hasBaseline", hasBaseline0);
      if (hasTreatment0 !== "all") params.set("hasTreatment", hasTreatment0);
      if (waitingForPro0 !== "all") params.set("waitingForPro", waitingForPro0);
      if (currentStageCode0) params.set("currentStageCode", currentStageCode0);

      params.set("ts", String(Date.now()));

      const url = `/api/admin/users?${params.toString()}`;
      const r = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("bad_response");

      const j = (await r.json()) as UsersResponse;
      if (!j?.ok) throw new Error("request_failed");
      setData(j);
    } catch (e: any) {
      setErr(String(e?.message || "internal_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setQ(q0);
    setPage(page0);
    setLimit(limit0);
    setFilter(filter0);
    setSort(sort0);
    setBaselineLevel(baselineLevel0);
    setHasBaseline(hasBaseline0);
    setHasTreatment(hasTreatment0);
    setWaitingForPro(waitingForPro0);
    setCurrentStageCode(currentStageCode0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q0, page0, limit0, filter0, sort0, baselineLevel0, hasBaseline0, hasTreatment0, waitingForPro0, currentStageCode0]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q0, page0, limit0, filter0, baselineLevel0, hasBaseline0, hasTreatment0, waitingForPro0, currentStageCode0]);

  const view = useMemo(() => {
    const rows = data?.users || [];

    let filtered = rows;

    if (filter === "expiring") {
      filtered = filtered.filter((u) => planState(u) === "expiring");
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "created_desc" || sort === "created_asc") {
        const da = safeDate(a.createdAt || null)?.getTime() || 0;
        const db = safeDate(b.createdAt || null)?.getTime() || 0;
        return sort === "created_desc" ? db - da : da - db;
      }

      if (sort === "expires_asc" || sort === "expires_desc") {
        const da = safeDate(a.planExpiresAt || null)?.getTime() ?? Number.POSITIVE_INFINITY;
        const db = safeDate(b.planExpiresAt || null)?.getTime() ?? Number.POSITIVE_INFINITY;
        return sort === "expires_asc" ? da - db : db - da;
      }

      return 0;
    });

    return sorted;
  }, [data, filter, sort]);

  const stageOptions = useMemo(() => {
    const map = new Map<string, string>();

    for (const u of data?.users || []) {
      if (u.currentStageCode && u.currentStageTitle) {
        map.set(u.currentStageCode, u.currentStageTitle);
      }
    }

    return Array.from(map.entries()).map(([code, title]) => ({ code, title }));
  }, [data]);

  async function setPlan(userId: string, plan: "pro" | "free", daysVal?: number) {
    setBusy((m) => ({ ...m, [userId]: true }));
    try {
      const endpoint = plan === "pro" ? `/api/admin/users/${userId}/set-plan` : `/api/admin/users/${userId}/cancel-plan`;
      const body = plan === "pro" ? { plan: "pro", days: daysVal || 30 } : {};

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: plan === "pro" ? JSON.stringify(body) : undefined,
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("bad_response");
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "request_failed");
      await load();
    } catch (e: any) {
      alert(String(e?.message || "internal_error"));
    } finally {
      setBusy((m) => ({ ...m, [userId]: false }));
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("حذف کامل کاربر؟ این عمل برگشت‌پذیر نیست.")) return;

    setBusy((m) => ({ ...m, [userId]: true }));
    try {
      const r = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("bad_response");

      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "request_failed");

      await load();
    } catch (e: any) {
      alert(String(e?.message || "internal_error"));
    } finally {
      setBusy((m) => ({ ...m, [userId]: false }));
    }
  }

  async function exportCsv() {
    try {
      const all: UserRow[] = [];
      let p = 1;
      const per = 100;

      while (true) {
        const params = new URLSearchParams();
        if (q0) params.set("q", q0);
        params.set("page", String(p));
        params.set("limit", String(per));

        if (filter0 !== "all") {
          if (filter0 === "pro" || filter0 === "free" || filter0 === "expired") {
            params.set("plan", filter0);
          }
        }

        if (baselineLevel0 !== "all") params.set("baselineLevel", baselineLevel0);
        if (hasBaseline0 !== "all") params.set("hasBaseline", hasBaseline0);
        if (hasTreatment0 !== "all") params.set("hasTreatment", hasTreatment0);
        if (waitingForPro0 !== "all") params.set("waitingForPro", waitingForPro0);
        if (currentStageCode0) params.set("currentStageCode", currentStageCode0);

        params.set("ts", String(Date.now()));

        const url = `/api/admin/users?${params.toString()}`;
        const r = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("bad_response");

        const j = (await r.json()) as UsersResponse;
        if (!j?.ok) throw new Error("request_failed");

        let batch = j.users || [];
        if (filter0 === "expiring") {
          batch = batch.filter((u) => planState(u) === "expiring");
        }

        all.push(...batch);

        if ((j.users || []).length === 0) break;
        if (p * per >= (j.total || 0)) break;
        if (p > 200) break;

        p++;
      }

      const csv = buildCsv(all);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `users-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      alert(String(e?.message || "export_failed"));
    }
  }

  return (
    <div style={{ maxWidth: 1480, marginInline: "auto" }}>
      <div
        style={{
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>مدیریت کاربران</h1>
          <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
            {data ? `مجموع: ${data.total} (صفحه ${data.page})` : "—"}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 560 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="جستجو: نام / شماره / آیدی"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid #374151",
                backgroundColor: "#0b1220",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              onClick={applySearch}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #7c2d12",
                backgroundColor: "#ea580c",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              جستجو
            </button>
            <button
              onClick={() => {
                setQ("");
                setPage(1);
                syncUrl({ q: "", page: 1 });
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #334155",
                backgroundColor: "#0b1220",
                color: "#e2e8f0",
                fontSize: "12px",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="پاک کردن جستجو"
            >
              پاک‌کردن
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={exportCsv}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            دانلود CSV
          </button>

          <select
            value={filter}
            onChange={(e) => {
              const v = e.target.value as "all" | "pro" | "free" | "expired" | "expiring";
              setFilter(v);
              setPage(1);
              syncUrl({ filter: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="all">همه پلن‌ها</option>
            <option value="pro">PRO/VIP فعال</option>
            <option value="expiring">نزدیک انقضا</option>
            <option value="expired">منقضی</option>
            <option value="free">FREE</option>
          </select>

          <select
            value={baselineLevel}
            onChange={(e) => {
              const v = e.target.value as BaselineLevel | "all";
              setBaselineLevel(v);
              setPage(1);
              syncUrl({ baselineLevel: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="all">همه شدت‌ها</option>
            <option value="manageable">خفیف</option>
            <option value="moderate">متوسط</option>
            <option value="severe">شدید</option>
            <option value="unknown">نامشخص</option>
          </select>

          <select
            value={hasBaseline}
            onChange={(e) => {
              const v = e.target.value as "all" | "true" | "false";
              setHasBaseline(v);
              setPage(1);
              syncUrl({ hasBaseline: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="all">همه baselineها</option>
            <option value="true">دارای baseline</option>
            <option value="false">بدون baseline</option>
          </select>

          <select
            value={hasTreatment}
            onChange={(e) => {
              const v = e.target.value as "all" | "true" | "false";
              setHasTreatment(v);
              setPage(1);
              syncUrl({ hasTreatment: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="all">همه وضعیت‌های درمان</option>
            <option value="true">درمان شروع شده</option>
            <option value="false">درمان شروع نشده</option>
          </select>

          <select
            value={waitingForPro}
            onChange={(e) => {
              const v = e.target.value as "all" | "true" | "false";
              setWaitingForPro(v);
              setPage(1);
              syncUrl({ waitingForPro: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="all">همه Free Passها</option>
            <option value="true">ویس اینترو کامل + هنوز FREE</option>
            <option value="false">سایر</option>
          </select>

          <select
            value={currentStageCode}
            onChange={(e) => {
              const v = e.target.value;
              setCurrentStageCode(v);
              setPage(1);
              syncUrl({ currentStageCode: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
              minWidth: 160,
            }}
          >
            <option value="">همه مرحله‌ها</option>
            {stageOptions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.title}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              const v = e.target.value as "created_desc" | "created_asc" | "expires_asc" | "expires_desc";
              setSort(v);
              setPage(1);
              syncUrl({ sort: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            <option value="created_desc">جدیدترین</option>
            <option value="created_asc">قدیمی‌ترین</option>
            <option value="expires_asc">نزدیک‌ترین انقضا</option>
            <option value="expires_desc">دورترین انقضا</option>
          </select>

          <select
            value={String(limit)}
            onChange={(e) => {
              const v = Number(e.target.value) || 30;
              setLimit(v);
              setPage(1);
              syncUrl({ limit: v, page: 1 });
            }}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0b1220",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 800,
              outline: "none",
            }}
          >
            {[30, 50, 100].map((n) => (
              <option key={n} value={n}>
                limit {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.03)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          {loading ? "در حال دریافت..." : err ? `خطا: ${err}` : " "}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1380 }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                {[
                  "نام",
                  "شماره",
                  "سن",
                  "جنسیت",
                  "پلن",
                  "انقضا",
                  "نمره آزمون",
                  "شدت آزمون ",
                  "مرحله شروع",
                  "شروع درمان",
                  "مرحله فعلی",
                  "اقدامات",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "center",
                      padding: "12px 12px",
                      fontSize: 12,
                      color: "#cbd5e1",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((u) => {
                const dl = daysLeft(u.planExpiresAt || null);
                const st = planState(u);
                const isBusy = !!busy[u.id];

                return (
                  <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 800, textAlign: "center" }}>
                      {u.fullName || "—"}
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{u.id}</div>
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 13, textAlign: "center" }}>{u.phone}</td>

                    <td style={{ padding: "12px 12px", fontSize: 13, textAlign: "center" }}>
                      {calcAge(u.birthDate || null)}
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 13, textAlign: "center" }}>
                      {genderFa(u.gender || null)}
                    </td>

                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <PlanBadge u={u} />
                        {(u.plan === "pro" || u.plan === "vip") && dl !== null ? (
                          <span
                            style={{
                              fontSize: 12,
                              color:
                                st === "expired" ? "#fca5a5" : st === "expiring" ? "#fdba74" : "#a7f3d0",
                            }}
                          >
                            {dl <= 0 ? "0" : dl} روز
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 12, color: "#cbd5e1", textAlign: "center" }}>
                      {u.planExpiresAt ? fmtFaDate(u.planExpiresAt) : "—"}
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 13, textAlign: "center", fontWeight: 800 }}>
                      {u.baselineScore ?? "—"}
                    </td>

                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <BaselineBadge level={u.baselineLevel || "unknown"} />
                    </td>


                    <td style={{ padding: "12px 12px", fontSize: 12, textAlign: "center" }}>
                      {u.introAudioCompletedAt ? (
                        <div>
                          <div style={{ color: "#86efac", fontWeight: 800 }}>تکمیل شده</div>
                          <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>
                            {fmtFaDate(u.introAudioCompletedAt)}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 12, color: "#cbd5e1", textAlign: "center" }}>
                      {u.treatmentStartedAt ? fmtFaDate(u.treatmentStartedAt) : "—"}
                    </td>

                    <td style={{ padding: "12px 12px", fontSize: 12, textAlign: "center" }}>
                      {u.currentStageTitle ? (
                        <div>
                          <div style={{ color: "#e2e8f0", fontWeight: 800 }}>{u.currentStageTitle}</div>
                          {u.currentStageCode ? (
                            <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>{u.currentStageCode}</div>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          disabled={isBusy}
                          onClick={() => {
                            setDays(30);
                            setModal({ user: u });
                          }}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 12,
                            border: "1px solid #065f46",
                            backgroundColor: "#064e3b",
                            color: "#d1fae5",
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: isBusy ? "default" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          PRO
                        </button>

                        <button
                          disabled={isBusy}
                          onClick={() => setPlan(u.id, "free")}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 12,
                            border: "1px solid #334155",
                            backgroundColor: "#0b1220",
                            color: "#e2e8f0",
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: isBusy ? "default" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          FREE
                        </button>

                        <button
                          disabled={isBusy}
                          onClick={() => deleteUser(u.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 12,
                            border: "1px solid #7f1d1d",
                            backgroundColor: "#450a0a",
                            color: "#fecaca",
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: isBusy ? "default" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && view.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: "18px 12px", color: "#94a3b8", fontSize: 12, textAlign: "center" }}>
                    موردی پیدا نشد.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            نمایش{" "}
            {data
              ? `${Math.min(data.total, (page - 1) * limit + 1)} تا ${Math.min(data.total, page * limit)} از ${data.total}`
              : "—"}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={page <= 1}
              onClick={() => {
                const np = Math.max(1, page - 1);
                setPage(np);
                syncUrl({ page: np });
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #334155",
                backgroundColor: page <= 1 ? "#0b1220" : "#111827",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 900,
                cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.6 : 1,
              }}
            >
              قبلی
            </button>

            <button
              disabled={!!data && page * limit >= data.total}
              onClick={() => {
                const np = page + 1;
                setPage(np);
                syncUrl({ page: np });
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #334155",
                backgroundColor: !!data && page * limit >= data.total ? "#0b1220" : "#111827",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 900,
                cursor: !!data && page * limit >= data.total ? "default" : "pointer",
                opacity: !!data && page * limit >= data.total ? 0.6 : 1,
              }}
            >
              بعدی
            </button>
          </div>
        </div>
      </div>

      {modal ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              backgroundColor: "#0b0f14",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 900 }}>PRO کردن کاربر</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
              {modal.user.fullName || "—"} • {modal.user.phone}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>مدت (روز)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 30)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  backgroundColor: "#0b1220",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                پیش‌فرض: 30 روز • نزدیک انقضا = 3 روز آخر
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  backgroundColor: "#0b1220",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                بستن
              </button>

              <button
                onClick={async () => {
                  const id = modal.user.id;
                  setModal(null);
                  await setPlan(id, "pro", days);
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid #065f46",
                  backgroundColor: "#16a34a",
                  color: "#052e16",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                اعمال
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
