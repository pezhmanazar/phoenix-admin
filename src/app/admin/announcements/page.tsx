// phoenix-admin\src\app\admin\announcements\page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = ""; // same-origin (Next proxy)

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

// datetime-local → ISO
function toISOorNull(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ✅ نمایش شمسی/جلالی + ساعت تهران
function fmtJalali(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
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
    // fallback
    return d.toLocaleString("fa-IR");
  }
}

// برای نمایش تاریخ شمسیِ مقدار datetime-local (که string مثل 2025-12-19T14:30 می‌ده)
function fmtJalaliFromLocalInput(v: string): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return fmtJalali(d.toISOString());
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
  startAt: string; // datetime-local
  endAt: string; // datetime-local

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

  // ✅ defaults (همگانی برای Free/Pro)
  targetFree: true,
  targetPro: true,
  targetExpiring: false,
  targetExpired: false,
};

/* ---------------- styles (match admin/users vibe) ---------------- */
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
  textAlign: "center", // ✅ وسط چین
  padding: "10px 12px",
  borderBottom: "1px solid #111827",
  background: "#050a12",
  color: "rgba(255,255,255,0.75)",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  textAlign: "center", // ✅ وسط چین
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "top",
};

function levelPill(level: AnnouncementLevel) {
  let bg = "#0b1220";
  let border = "#374151";
  let color = "#e5e7eb";
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
  } else {
    bg = "#071a2b";
    border = "#0369a1";
    color = "#bae6fd";
    label = "اطلاعات";
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
  width: 780,
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

function targetsText(it: Pick<
  Announcement,
  "targetFree" | "targetPro" | "targetExpiring" | "targetExpired"
>): string {
  const parts: string[] = [];
  if (it.targetFree) parts.push("Free");
  if (it.targetPro) parts.push("Pro");
  if (it.targetExpiring) parts.push("درحال انقضا");
  if (it.targetExpired) parts.push("منقضی");
  return parts.length ? parts.join(" / ") : "—";
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
      startAt: it.startAt ? it.startAt.slice(0, 16) : "",
      endAt: it.endAt ? it.endAt.slice(0, 16) : "",

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

    // ✅ حداقل یک گروه باید انتخاب شود
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
          startAt: toISOorNull(form.startAt),
          endAt: toISOorNull(form.endAt),

          // ✅ targets
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
          startAt: form.startAt ? toISOorNull(form.startAt) : null,
          endAt: form.endAt ? toISOorNull(form.endAt) : null,

          // ✅ targets
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

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={titleRow}>
          <div>
            <h2 style={h1}>بنر همگانی</h2>
            <div style={sub}>مدیریت پیام‌های داخل اپ (بالای صفحه / زیر هدر)</div>
          </div>
          <button onClick={openCreate} disabled={loading} style={btnPrimary}>
            + بنر جدید
          </button>
        </div>

        <div style={controls}>
          <input
            placeholder="جستجو: متن / عنوان / ID"
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
            بروزرسانی
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
                <th style={th}>شناسه</th>
                <th style={th}>متن</th>
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
                  <td style={{ ...td, whiteSpace: "nowrap", opacity: 0.95 }}>{it.id}</td>

                  <td style={{ ...td, maxWidth: 520, textAlign: "center" }}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>
                      {it.title ? it.title : <span style={{ opacity: 0.6 }}>بدون عنوان</span>}
                    </div>
                    <div style={{ opacity: 0.9, lineHeight: 1.8 }}>{it.message}</div>
                  </td>

                  <td style={td}>{levelPill(it.level)}</td>
                  <td style={td}>{it.enabled ? "✅ فعال" : "— غیرفعال"}</td>
                  <td style={td}>{it.dismissible ? "اختیاری" : "اجباری"}</td>
                  <td style={td}>{it.priority}</td>

                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>
                      {targetsText(it)}
                    </span>
                  </td>

                  <td style={td}>{fmtJalali(it.startAt)}</td>
                  <td style={td}>{fmtJalali(it.endAt)}</td>

                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(it)} disabled={loading} style={iconBtn}>
                      ویرایش
                    </button>{" "}
                    <button onClick={() => remove(it)} disabled={loading} style={iconBtnDanger}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td style={{ ...td, textAlign: "center", opacity: 0.7 }} colSpan={10}>
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
              <h3 style={modalTitle}>{editItem ? "ویرایش بنر" : "ساخت بنر جدید"}</h3>
              <button onClick={() => setModalOpen(false)} style={xBtn} aria-label="close">
                ×
              </button>
            </div>

            {!editItem ? (
              <div style={{ marginBottom: 10 }}>
                <label style={label}>شناسه (اختیاری)</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  style={input2}
                  placeholder="مثلاً: maintenance_2025_12"
                />
                <div style={helper}>اگر خالی بگذاری، سیستم خودش یک شناسه می‌سازد.</div>
              </div>
            ) : (
              <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.85 }}>
                <b>شناسه:</b> {editItem.id}
              </div>
            )}

            <div style={fieldRow}>
              <div>
                <label style={label}>عنوان (اختیاری)</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={input2}
                  placeholder="مثلاً: اطلاعیه مهم"
                />
              </div>
              <div>
                <label style={label}>اولویت</label>
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
              <label style={label}>متن بنر</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={textarea2}
                placeholder="متن پیام…"
              />
            </div>

            <div style={fieldRow}>
              <div>
                <label style={label}>جایگاه</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value as AnnouncementPlacement })}
                  style={input2}
                >
                  <option value="top_banner">بالای صفحه (top_banner)</option>
                </select>
              </div>

              <div>
                <label style={label}>سطح پیام</label>
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

            {/* ✅ targets */}
            <div style={{ marginTop: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.85, marginBottom: 8 }}>
                ارسال به گروه‌ها
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
                  نزدیک به انقضا
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={form.targetExpired}
                    onChange={(e) => setForm({ ...form, targetExpired: e.target.checked })}
                  />
                  منقضی
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
                <label style={label}>شروع (اختیاری)</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  style={input2}
                />
                <div style={helper}>نمایش شمسی: {fmtJalaliFromLocalInput(form.startAt)}</div>
              </div>
              <div>
                <label style={label}>پایان (اختیاری)</label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  style={input2}
                />
                <div style={helper}>نمایش شمسی: {fmtJalaliFromLocalInput(form.endAt)}</div>
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