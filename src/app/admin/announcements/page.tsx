"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = ""; // ✅ same-origin (Next proxy)

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
    credentials: "include", // ✅ cookie admin_token is sent
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  // اگه سرور HTML داد یعنی upstream error / WCDN / route mismatch
  if (!ct.includes("application/json")) {
    throw new Error(
      `Non-JSON response (${res.status}): ${text.slice(0, 160)}...`
    );
  }

  const json = JSON.parse(text) as { ok?: boolean; error?: string };

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP_${res.status}`);
  }

  return JSON.parse(text) as T;
}

function toISOorNull(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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
};

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<Announcement[]>([]);

  const [q, setQ] = useState<string>("");
  const [enabled, setEnabled] = useState<string>(""); // "", "true", "false"

  const [modalOpen, setModalOpen] = useState<boolean>(false);
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
      const out = await api<AdminAnnouncementsListResponse>(
        `/admin/api/announcements${queryString}`
      );
      setItems(out.data.items || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Load failed: ${msg}`);
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
    });
    setModalOpen(true);
  }

  async function submit(): Promise<void> {
    if (!form.message.trim()) {
      alert("message لازم است");
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
      alert(`Save failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function remove(it: Announcement): Promise<void> {
    if (!confirm(`حذف شود؟\n${it.id}`)) return;
    setLoading(true);
    try {
      await api(`/admin/api/announcements/${it.id}/delete`, {
        method: "POST",
        body: {},
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Delete failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Announcements (بنر همگانی)</h2>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          placeholder="جستجو: متن/عنوان/ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={enabled}
          onChange={(e) => setEnabled(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">همه</option>
          <option value="true">فقط فعال</option>
          <option value="false">فقط غیرفعال</option>
        </select>
        <button
          onClick={openCreate}
          disabled={loading}
          style={{ padding: "8px 12px" }}
        >
          + بنر جدید
        </button>
      </div>

      {loading ? <div>Loading...</div> : null}

      <table
        width="100%"
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Message</th>
            <th>Level</th>
            <th>Enabled</th>
            <th>Dismissible</th>
            <th>Priority</th>
            <th>Start</th>
            <th>End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td style={{ maxWidth: 420 }}>{it.message}</td>
              <td>{it.level}</td>
              <td>{String(it.enabled)}</td>
              <td>{String(it.dismissible)}</td>
              <td>{it.priority}</td>
              <td>{it.startAt ? new Date(it.startAt).toLocaleString() : "-"}</td>
              <td>{it.endAt ? new Date(it.endAt).toLocaleString() : "-"}</td>
              <td>
                <button onClick={() => openEdit(it)} disabled={loading}>
                  Edit
                </button>{" "}
                <button onClick={() => remove(it)} disabled={loading}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={9} align="center">
                هیچ بنری نیست
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {modalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ background: "#fff", padding: 16, width: 720, maxWidth: "100%" }}>
            <h3>{editItem ? "ویرایش بنر" : "ساخت بنر"}</h3>

            {!editItem ? (
              <div style={{ marginBottom: 10 }}>
                <label>ID (اختیاری): </label>
                <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <b>ID:</b> {editItem.id}
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <label>Title (اختیاری): </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Message:</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ width: "100%", height: 90 }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div>
                <label>Level:</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as AnnouncementLevel })}
                >
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div>
                <label>Placement:</label>
                <select
                  value={form.placement}
                  onChange={(e) =>
                    setForm({ ...form, placement: e.target.value as AnnouncementPlacement })
                  }
                >
                  <option value="top_banner">top_banner</option>
                </select>
              </div>

              <div>
                <label>Priority:</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value || 0) })}
                  style={{ width: 90 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />{" "}
                Enabled
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.dismissible}
                  onChange={(e) => setForm({ ...form, dismissible: e.target.checked })}
                />{" "}
                Dismissible (اختیاری)
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label>StartAt (اختیاری):</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>EndAt (اختیاری):</label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button onClick={submit} disabled={loading}>
                {editItem ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}