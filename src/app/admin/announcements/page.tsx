// phoenix-admin\src\app\admin\announcements\page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = ""; // same-origin (Next proxy)

// Iran timezone (no DST) = +03:30
const IR_TZ_OFFSET_MIN = 210; // minutes

type AnnouncementLevel = "info" | "warning" | "critical";
type AnnouncementPlacement = "top_banner";

type Announcement = {
  id: string;
  title: string | null;
  message: string;
  level: AnnouncementLevel;
  placement: AnnouncementPlacement;
  dismissible: boolean;
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;

  // ✅ targets
  targetFree: boolean;
  targetPro: boolean;
  targetExpiring: boolean;
  targetExpired: boolean;
};

type AdminAnnouncementsListResponse = {
  ok: true;
  data: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    items: Announcement[];
  };
};

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!ct.includes("application/json")) {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 160)}...`);
  }

  const json = JSON.parse(text) as { ok?: boolean; error?: string };

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP_${res.status}`);
  }

  return JSON.parse(text) as T;
}

/**
 * ✅ datetime-local -> ISO (treat input as Tehran time)
 * input: "YYYY-MM-DDTHH:mm"
 */
function tehranLocalInputToISO(v: string): string | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);

  if (![y, mo, d, hh, mm].every((x) => Number.isFinite(x))) return null;

  // This is the Tehran "wall clock" time. Convert to UTC by subtracting +03:30.
  const utcMs = Date.UTC(y, mo - 1, d, hh, mm) - IR_TZ_OFFSET_MIN * 60 * 1000;
  const dt = new Date(utcMs);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

/**
 * ✅ ISO -> datetime-local string (Tehran wall-clock)
 */
function isoToTehranLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  // Convert UTC -> Tehran (+03:30)
  const tehranMs = d.getTime() + IR_TZ_OFFSET_MIN * 60 * 1000;
  const t = new Date(tehranMs);

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = t.getUTCFullYear();
  const mm = pad(t.getUTCMonth() + 1);
  const dd = pad(t.getUTCDate());
  const hh = pad(t.getUTCHours());
  const mi = pad(t.getUTCMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// ✅ نمایش شمسی/جلالی + ساعت تهران (برای نمایش در لیست)
function fmtJalali(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString("fa-IR");
  }
}

// ✅ نمایش شمسی فقط وقتی انتخاب شده
function fmtJalaliFromTehranLocalInput(v: string): string {
  if (!v) return "";
  const iso = tehranLocalInputToISO(v);
  if (!iso) return "";
  return fmtJalali(iso);
}

type FormState = {
  id: string;
  title: string;
  message: string;
  level: AnnouncementLevel;
  placement: AnnouncementPlacement;
  dismissible: boolean;
  enabled: boolean;
  priority: number;
  startAt: string; // datetime-local (Tehran wall clock)
  endAt: string; // datetime-local (Tehran wall clock)

  // ✅ targets
  targetFree: boolean;
  targetPro: boolean;
  targetExpiring: boolean;
  targetExpired: boolean;
};

const emptyForm: FormState = {
  id: "",
  title: "",
  message: "",
  level: "info",
  placement: "top_banner",
  dismissible: true,
  enabled: true,
  priority: 0,
  startAt: "",
  endAt: "",

  targetFree: true,
  targetPro: true,
  targetExpiring: false,
  targetExpired: false,
};

/* ---------------- styles ---------------- */
const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#050a12,#020617)",
  border: "1px solid #111827",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
};

const titleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const h1: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
  color: "rgba(255,255,255,0.92)",
};

const sub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "rgba(255,255,255,0.6)",
};

const controls: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 12,
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#fff",
  fontSize: 13,
  outline: "none",
};

const select: React.CSSProperties = {
  ...input,
  padding: "10px 12px",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #7c2d12",
  background: "#ea580c",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  borderRadius: 14,
  border: "1px solid #111827",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #111827",
  background: "#050a12",
  color: "rgba(255,255,255,0.75)",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "middle",
};

function levelPill(level: AnnouncementLevel) {
  let bg = "#071a2b";
  let border = "#0369a1";
  let color = "#bae6fd";
  let label = "اطلاعات";

  if (level === "warning") {
    bg = "#2a1606";
    border = "#9a3412";
    color = "#fed7aa";
    label = "هشدار";
  } else if (level === "critical") {
    bg = "#2a0b10";
    border = "#b91c1c";
    color = "#fecaca";
    label = "بحرانی";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 900,
        whiteSpace: "nowrap",
        minWidth: 70,
      }}
      title={level}
    >
      {label}
    </span>
  );
}

const iconBtn: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const iconBtnDanger: React.CSSProperties = {
  ...iconBtn,
  border: "1px solid #7f1d1d",
  background: "#2a0b10",
  color: "#fecaca",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 50,
};

const modal: React.CSSProperties = {
  width: 820,
  maxWidth: "100%",
  background: "linear-gradient(180deg,#0b1220,#020617)",
  border: "1px solid #1f2937",
  borderRadius: 18,
  boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
  padding: 16,
  color: "#e5e7eb",
};

const modalHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 950,
};

const xBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#e5e7eb",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};

const fieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.7)",
  fontWeight: 800,
  marginBottom: 6,
  display: "block",
};

const input2: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #374151",
  background: "#050a12",
  color: "#e5e7eb",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const textarea2: React.CSSProperties = {
  ...input2,
  height: 110,
  resize: "vertical",
};

const helper: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  opacity: 0.75,
  lineHeight: 1.6,
};

const footer: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 14,
};

const btnSave: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #16a34a",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const btnCancel: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  fontWeight: 900,
  cursor: "pointer",
};

function targetsText(it: Pick<Announcement, "targetFree" | "targetPro" | "targetExpiring" | "targetExpired">): string {
  const parts: string[] = [];
  if (it.targetFree) parts.push("Free");
  if (it.targetPro) parts.push("Pro");
  if (it.targetExpiring) parts.push("Expiring");
  if (it.targetExpired) parts.push("Expired");
  return parts.length ? parts.join(" / ") : "—";
}

function statusText(enabled: boolean): string {
  return enabled ? "✅ فعال" : "غیرفعال";
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);

  const [q, setQ] = useState("");
  const [enabled, setEnabled] = useState<string>(""); // "", "true", "false"

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);

  const queryString = useMemo((): string => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("limit", "50");
    if (q.trim()) p.set("q", q.trim());
    if (enabled) p.set("enabled", enabled);
    return `?${p.toString()}`;
  }, [q, enabled]);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const out = await api<AdminAnnouncementsListResponse>(`/admin/api/announcements${queryString}`);
      setItems(out.data.items || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`خطا در دریافت لیست: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function openCreate(): void {
    setEditItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(it: Announcement): void {
    setEditItem(it);

    setForm({
      id: it.id || "",
      title: it.title || "",
      message: it.message || "",
      level: it.level || "info",
      placement: it.placement || "top_banner",
      dismissible: Boolean(it.dismissible),
      enabled: Boolean(it.enabled),
      priority: Number(it.priority || 0),

      // ✅ show inputs in Tehran local wall-clock
      startAt: isoToTehranLocalInput(it.startAt),
      endAt: isoToTehranLocalInput(it.endAt),

      targetFree: Boolean(it.targetFree),
      targetPro: Boolean(it.targetPro),
      targetExpiring: Boolean(it.targetExpiring),
      targetExpired: Boolean(it.targetExpired),
    });

    setModalOpen(true);
  }

  async function submit(): Promise<void> {
    if (!form.message.trim()) {
      alert("متن بنر لازم است");
      return;
    }

    if (!(form.targetFree || form.targetPro || form.targetExpiring || form.targetExpired)) {
      alert("حداقل یک گروه هدف را انتخاب کن");
      return;
    }

    setLoading(true);
    try {
      if (!editItem) {
        const payload = {
          ...(form.id.trim() ? { id: form.id.trim() } : {}),
          title: form.title.trim() ? form.title.trim() : null,
          message: form.message.trim(),
          level: form.level,
          placement: form.placement,
          dismissible: Boolean(form.dismissible),
          enabled: Boolean(form.enabled),
          priority: Number(form.priority || 0),

          // ✅ store as ISO by treating inputs as Tehran time
          startAt: tehranLocalInputToISO(form.startAt),
          endAt: tehranLocalInputToISO(form.endAt),

          targetFree: Boolean(form.targetFree),
          targetPro: Boolean(form.targetPro),
          targetExpiring: Boolean(form.targetExpiring),
          targetExpired: Boolean(form.targetExpired),
        };
        await api(`/admin/api/announcements`, { method: "POST", body: payload });
      } else {
        const payload = {
          title: form.title.trim() ? form.title.trim() : null,
          message: form.message.trim(),
          level: form.level,
          placement: form.placement,
          dismissible: Boolean(form.dismissible),
          enabled: Boolean(form.enabled),
          priority: Number(form.priority || 0),

          startAt: form.startAt ? tehranLocalInputToISO(form.startAt) : null,
          endAt: form.endAt ? tehranLocalInputToISO(form.endAt) : null,

          targetFree: Boolean(form.targetFree),
          targetPro: Boolean(form.targetPro),
          targetExpiring: Boolean(form.targetExpiring),
          targetExpired: Boolean(form.targetExpired),
        };
        await api(`/admin/api/announcements/${editItem.id}`, {
          method: "PATCH",
          body: payload,
        });
      }

      setModalOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`خطا در ذخیره: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function remove(it: Announcement): Promise<void> {
    if (!confirm(`حذف شود؟\n${it.id}`)) return;
    setLoading(true);
    try {
      await api(`/admin/api/announcements/${it.id}/delete`, { method: "POST", body: {} });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`خطا در حذف: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const selectedStartJ = fmtJalaliFromTehranLocalInput(form.startAt);
  const selectedEndJ = fmtJalaliFromTehranLocalInput(form.endAt);

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={titleRow}>
          <div>
            <h2 style={h1}>📣 بنر همگانی</h2>
            <div style={sub}>مدیریت پیام‌های داخل اپ </div>
          </div>
          <button onClick={openCreate} disabled={loading} style={btnPrimary}>
            ➕ بنر جدید
          </button>
        </div>

        <div style={controls}>
          <input
            placeholder="جستجو: عنوان / متن / ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ ...input, flex: 1, minWidth: 220 }}
          />
          <select value={enabled} onChange={(e) => setEnabled(e.target.value)} style={select}>
            <option value="">همه</option>
            <option value="true">فقط فعال</option>
            <option value="false">فقط غیرفعال</option>
          </select>
          <button onClick={() => load()} disabled={loading} style={btnGhost}>
            🔄 بروزرسانی
          </button>
        </div>

        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, padding: "6px 2px" }}>
            در حال دریافت...
          </div>
        ) : null}

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>عنوان</th>
                <th style={th}>سطح</th>
                <th style={th}>وضعیت</th>
                <th style={th}>نوع</th>
                <th style={th}>اولویت</th>
                <th style={th}>گروه هدف</th>
                <th style={th}>شروع</th>
                <th style={th}>پایان</th>
                <th style={th}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ ...td, textAlign: "center", maxWidth: 360 }}>
                    <div style={{ fontWeight: 950, opacity: 0.95, lineHeight: 1.6 }}>
                      {it.title ? it.title : <span style={{ opacity: 0.6 }}>بدون عنوان</span>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6, direction: "ltr" }}>
                      {it.id}
                    </div>
                  </td>

                  <td style={td}>{levelPill(it.level)}</td>
                  <td style={td}>{statusText(it.enabled)}</td>
                  <td style={td}>{it.dismissible ? "اختیاری" : "اجباری"}</td>
                  <td style={td}>{it.priority}</td>

                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>{targetsText(it)}</span>
                  </td>

                  <td style={td}>{fmtJalali(it.startAt)}</td>
                  <td style={td}>{fmtJalali(it.endAt)}</td>

                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(it)} disabled={loading} style={iconBtn}>
                      ✏️ ویرایش
                    </button>{" "}
                    <button onClick={() => remove(it)} disabled={loading} style={iconBtnDanger}>
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td style={{ ...td, textAlign: "center", opacity: 0.7 }} colSpan={9}>
                    هیچ بنری وجود ندارد
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div
          style={overlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div style={modal}>
            <div style={modalHeader}>
              <h3 style={modalTitle}>{editItem ? "✏️ ویرایش بنر" : "➕ ساخت بنر جدید"}</h3>
              <button onClick={() => setModalOpen(false)} style={xBtn} aria-label="close">
                ×
              </button>
            </div>

            {!editItem ? (
              <div style={{ marginBottom: 10 }}>
                <label style={label}>🆔 شناسه</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  style={input2}
                />
                <div style={helper}>اگر خالی بگذاری، سیستم خودش شناسه تولید میکنه.</div>
              </div>
            ) : (
              <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.85 }}>
                <b>🆔 شناسه:</b> <span style={{ direction: "ltr" }}>{editItem.id}</span>
              </div>
            )}

            <div style={fieldRow}>
              <div>
                <label style={label}>🧾 عنوان</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={input2}
                />
              </div>
              <div>
                <label style={label}>⭐ اولویت</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value || 0) })}
                  style={input2}
                  min={0}
                />
                <div style={helper}>عدد بالاتر یعنی نمایش جلوتر.</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={label}>📝 متن بنر</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={textarea2}
                placeholder="متن پیام…"
              />
            </div>

            <div style={fieldRow}>
              <div>
                <label style={label}>📍 جایگاه</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value as AnnouncementPlacement })}
                  style={input2}
                >
                  <option value="top_banner">بالای صفحه</option>
                </select>
              </div>

              <div>
                <label style={label}>🚦 سطح پیام</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as AnnouncementLevel })}
                  style={input2}
                >
                  <option value="info">اطلاعات</option>
                  <option value="warning">هشدار</option>
                  <option value="critical">بحرانی</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.85, marginBottom: 8 }}>
                🎯 Target Groups
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={form.targetFree}
                    onChange={(e) => setForm({ ...form, targetFree: e.target.checked })}
                  />
                  Free
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={form.targetPro}
                    onChange={(e) => setForm({ ...form, targetPro: e.target.checked })}
                  />
                  Pro
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={form.targetExpiring}
                    onChange={(e) => setForm({ ...form, targetExpiring: e.target.checked })}
                  />
                  Expiring
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={form.targetExpired}
                    onChange={(e) => setForm({ ...form, targetExpired: e.target.checked })}
                  />
                  Expired
                </label>
              </div>

              {!(form.targetFree || form.targetPro || form.targetExpiring || form.targetExpired) ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "#fecaca", fontWeight: 900 }}>
                  حداقل یک گروه باید انتخاب شود
                </div>
              ) : null}
            </div>

            <div style={{ ...fieldRow, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={label}>🕒 شروع</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  style={input2}
                />
                {form.startAt ? <div style={helper}>نمایش شمسی: {selectedStartJ}</div> : null}
              </div>

              <div>
                <label style={label}>🕒 پایان </label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  style={input2}
                />
                {form.endAt ? <div style={helper}>نمایش شمسی: {selectedEndJ}</div> : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                فعال
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={form.dismissible}
                  onChange={(e) => setForm({ ...form, dismissible: e.target.checked })}
                />
                قابل بستن (اختیاری)
              </label>

              {!form.dismissible ? (
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  * بنرهای اجباری بعد از seen طبق منطق سرور مدیریت می‌شوند.
                </span>
              ) : null}
            </div>

            <div style={footer}>
              <button onClick={() => setModalOpen(false)} disabled={loading} style={btnCancel}>
                انصراف
              </button>
              <button onClick={submit} disabled={loading} style={btnSave}>
                {editItem ? "ذخیره تغییرات" : "ساخت بنر"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}