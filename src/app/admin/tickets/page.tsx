// src/app/admin/tickets/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: "open" | "pending" | "closed";
  type: "tech" | "therapy";
  createdAt: string;
  pinned?: boolean;
  unread?: boolean;
  user?: {
    id: string;
    fullName?: string | null;
    full_name?: string | null;
    phone?: string | null;
  } | null;
  assignedAdmin?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  userName?: string | null;
  displayName?: string | null;
  openedByName?: string | null;
  contact?: string | { name?: string };
  email?: string;
  phone?: string;
  updatedAt?: string;
  messages?: Array<{
    id: string;
    createdAt: string;
    sender?: "user" | "admin";
  }>;
  lastAt?: string;
  _lastSender?: "user" | "admin" | null;
};

type AdminOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type TicketsResponse = {
  ok?: boolean;
  error?: string;

  tickets?: Ticket[];

  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };

  adminOptions?: AdminOption[];
};

function buildQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim()) usp.set(k, v.trim());
  });
  return usp.toString() ? `?${usp.toString()}` : "";
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s} ثانیه پیش`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} روز پیش`;
  return d.toLocaleString("fa-IR");
}

function extractLastAt(t: Ticket): string {
  const fromUpdated =
    t.updatedAt && !Number.isNaN(Date.parse(t.updatedAt)) ? t.updatedAt : null;

  const lastMsgAt =
    Array.isArray(t.messages) && t.messages.length
      ? t.messages[t.messages.length - 1]?.createdAt
      : null;

  const fromCreated = t.createdAt;

  return (
    (lastMsgAt && !Number.isNaN(Date.parse(lastMsgAt)) && lastMsgAt) ||
    fromUpdated ||
    fromCreated
  );
}

function extractLastSender(t: Ticket): "user" | "admin" | null {
  if (Array.isArray(t.messages) && t.messages.length) {
    const sender = t.messages[t.messages.length - 1]?.sender;

    if (sender === "user" || sender === "admin") {
      return sender;
    }
  }

  return null;
}

function cleanName(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";

  if (!s) return "";
  if (s === "کاربر" || s === "—") return "";

  return s;
}
// ---------- چیپ‌ها با استایل inline مثل لاگین ----------
function StatusChip({ status }: { status: Ticket["status"] }) {
  let bg = "#1e293b";
  let color = "#bfdbfe";
  let label = "باز";
  if (status === "pending") {
    bg = "#422006";
    color = "#facc15";
    label = "در انتظار";
  }
  if (status === "closed") {
    bg = "#022c22";
    color = "#bbf7d0";
    label = "بسته";
  }
  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: "11px",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function TypeChip({ type }: { type: Ticket["type"] }) {
  let bg = "#0f172a";
  let color = "#7dd3fc";
  let label = "پشتیبانی فنی";
  if (type === "therapy") {
    bg = "#1e1b4b";
    color = "#e9d5ff";
    label = "ارتباط با درمانگر";
  }
  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: "11px",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | "open" | "unread">("");
  const [type, setType] = useState<"" | "tech" | "therapy">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [assignedAdminFilter, setAssignedAdminFilter] = useState("");

  const [page, setPage] = useState(1);

  const [totalItems, setTotalItems] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);

  const pageSize = 15;

  const assignedAdmins = useMemo(
    () =>
      adminOptions.map((admin) => ({
        id: admin.id,

        label: admin.name?.trim() || admin.email?.trim() || "ادمین بدون نام",
      })),
    [adminOptions],
  );

  const query = useMemo(
    () =>
      buildQuery({
        status,
        type,

        q: debouncedQ || undefined,

        assignedAdminId: assignedAdminFilter || undefined,

        page: String(page),

        pageSize: String(pageSize),
      }),
    [status, type, debouncedQ, assignedAdminFilter, page],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedQ(q.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [q]);

  const fetchTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const res = await fetch(`/api/admin/tickets${query}`, {
          cache: "no-store",
        });

        const data = (await res
          .json()
          .catch(() => null)) as TicketsResponse | null;

        if (!res.ok || !data?.ok) {
          console.error("API Error:", data?.error || "request_failed");

          return;
        }

        const rawTickets = Array.isArray(data.tickets) ? data.tickets : [];

        /*
         * backend فقط آخرین message را می‌دهد،
         * بنابراین دیگر client-side filter/sort نداریم.
         */
        const withDisplay = rawTickets.map((ticket) => ({
          ...ticket,

          lastAt: extractLastAt(ticket),

          _lastSender: extractLastSender(ticket),
        }));

        setTickets(withDisplay);

        setTotalItems(Number(data.pagination?.totalItems ?? 0));

        setTotalPages(Math.max(1, Number(data.pagination?.totalPages ?? 1)));

        if (Array.isArray(data.adminOptions)) {
          setAdminOptions(data.adminOptions);
        }

        /*
         * اگر مثلاً آخرین آیتم صفحه حذف شد و
         * page فعلی دیگر وجود نداشت.
         */
        const serverPage = Math.max(1, Number(data.pagination?.page ?? page));

        const serverTotalPages = Math.max(
          1,
          Number(data.pagination?.totalPages ?? 1),
        );

        if (serverPage > serverTotalPages) {
          setPage(serverTotalPages);
        }
      } catch (e: unknown) {
        console.error("Fetch failed:", e instanceof Error ? e.message : e);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [query, page],
  );

  useEffect(() => {
    void fetchTickets(false);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchTickets(true);
      }
    }, 50000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTickets]);

  async function markReadOptimistic(ticketId: string) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, unread: false } : t)),
    );
    try {
      await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: false }),
      });
    } catch (err) {
      console.error("markRead failed:", err);
    }
  }
  // ---------- UI شبیه لاگین: container وسط صفحه با کارت ----------
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)", // زیر هدر layout
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1080px",
          boxSizing: "border-box",
        }}
      >
        {/* هدر صفحه */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              🎫 لیست تیکت‌ها
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              اینجا تمام تیکت‌های کاربران را می‌بینی و می‌توانی آن‌ها را مدیریت
              کنی.
            </p>
          </div>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid #333",
              backgroundColor: "#0b0b0b",
              padding: "4px 10px",
              fontSize: "11px",
              color: "#e5e7eb",
              whiteSpace: "nowrap",
            }}
          >
            مجموع تیکت‌ها:{" "}
            <span style={{ color: "#fb923c", fontWeight: 700 }}>
              {totalItems}
            </span>
          </span>
        </div>

        {/* کارت فیلتر + لیست */}
        <div
          style={{
            width: "100%",
            padding: "20px 20px 16px",
            borderRadius: "18px",
            border: "1px solid #222",
            backgroundColor: "#050505",
            boxShadow: "0 20px 40px rgba(0,0,0,0.65)",
            boxSizing: "border-box",
          }}
        >
          {/* فیلترها */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            {/* وضعیت */}
            <div style={{ minWidth: "150px", flex: "1 1 120px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  opacity: 0.85,
                }}
              >
                وضعیت
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);

                  setStatus(e.target.value as "" | "open" | "unread");
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              >
                <option value="">همه</option>
                <option value="open">باز</option>
                <option value="unread">خوانده‌نشده</option>
              </select>
            </div>

            {/* نوع */}
            <div style={{ minWidth: "150px", flex: "1 1 120px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  opacity: 0.85,
                }}
              >
                نوع
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setPage(1);

                  setType(e.target.value as "" | "tech" | "therapy");
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              >
                <option value="">همه</option>
                <option value="tech">پشتیبانی فنی</option>
                <option value="therapy">ارتباط با درمانگر</option>
              </select>
            </div>

            {/* جستجو */}
            <div style={{ flex: "2 1 200px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  opacity: 0.85,
                }}
              >
                جستجو
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="نام کاربر، توضیح یا راه ارتباط…"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
            {/* ادمین مسئول */}
            <div style={{ flex: "1 1 180px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  opacity: 0.85,
                }}
              >
                ادمین مسئول
              </label>

              <select
                value={assignedAdminFilter}
                onChange={(e) => {
                  setPage(1);
                  setAssignedAdminFilter(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              >
                <option value="">همه ادمین‌ها</option>
                <option value="__unassigned__">تخصیص‌نشده</option>
                {assignedAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ردیف زیر فیلتر: توضیح + دکمه‌ها */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
              }}
            >
              ردیف‌های سنجاق‌شده همیشه بالاتر از بقیه نمایش داده می‌شوند.
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  void fetchTickets(false);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: "#ea580c",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                اعمال فیلتر
              </button>
              <button
                onClick={() => {
                  setStatus("");
                  setType("");
                  setQ("");
                  setAssignedAdminFilter("");
                  setPage(1);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "9px",
                  border: "1px solid #333",
                  backgroundColor: "#111827",
                  color: "#e5e7eb",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                پاک‌سازی
              </button>
            </div>
          </div>

          {/* خط جداکننده */}
          <div
            style={{
              height: "1px",
              width: "100%",
              background:
                "linear-gradient(90deg, transparent, #374151, transparent)",
              marginBottom: "10px",
            }}
          />

          {/* محتوا */}
          {loading ? (
            <p
              style={{
                fontSize: "12px",
                color: "#e5e7eb",
                textAlign: "center",
                padding: "10px 0",
              }}
            >
              ⏳ در حال بارگذاری...
            </p>
          ) : tickets.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
                borderRadius: "12px",
                border: "1px dashed #374151",
                backgroundColor: "#020617",
                fontSize: "12px",
                color: "#e5e7eb",
                textAlign: "center",
              }}
            >
              هیچ تیکتی پیدا نشد.
            </div>
          ) : (
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #1f2933",
                backgroundColor: "#020617",
                maxHeight: "520px",
                overflowY: "auto",
              }}
            >
              {/* هدر لیست */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "3fr 1.5fr 1.5fr 2fr",
                  gap: "8px",
                  padding: "10px 12px",
                  borderBottom: "1px solid #111827",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                <div style={{ textAlign: "center" }}>کاربر</div>
                <div style={{ textAlign: "center" }}>نوع</div>
                <div style={{ textAlign: "center" }}>وضعیت</div>
                <div style={{ textAlign: "center" }}>آخرین فعالیت</div>
              </div>

              {/* ردیف‌ها */}
              {tickets.map((t) => {
                const u = t.user || null;

                const nameToShow =
                  cleanName(u?.fullName) ||
                  cleanName(t.user?.full_name) ||
                  cleanName(t.displayName) ||
                  cleanName(t.userName) ||
                  cleanName(t.openedByName) ||
                  cleanName(
                    typeof t.contact === "object" && t.contact
                      ? t.contact.name
                      : undefined,
                  ) ||
                  cleanName(
                    typeof t.contact === "string" ? t.contact : undefined,
                  ) ||
                  cleanName(t.phone) ||
                  cleanName(t.email) ||
                  cleanName(t.title) ||
                  "کاربر";

                const lastAt = t.lastAt || t.createdAt;
                const isUnread = !!t.unread;
                const assignedAdminName =
                  t.assignedAdmin?.name?.trim() ||
                  t.assignedAdmin?.email?.trim() ||
                  "تخصیص نشده";

                return (
                  <div
                    key={t.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "3fr 1.5fr 1.5fr 2fr",
                      gap: "8px",
                      padding: "9px 12px",
                      borderBottom: "1px solid #111827",
                      backgroundColor: isUnread ? "#020617" : "transparent",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                  >
                    {/* کاربر */}
                    <div style={{ textAlign: "center" }}>
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        prefetch={false}
                        onClick={() => markReadOptimistic(t.id)}
                        style={{
                          color: "#fb923c",
                          textDecoration: "none",
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          fontWeight: isUnread ? 700 : 500,
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          {t.pinned ? (
                            <span
                              title="سنجاق‌شده"
                              style={{ color: "#facc15", fontSize: "11px" }}
                            >
                              ★
                            </span>
                          ) : null}

                          <span>{nameToShow}</span>

                          {isUnread && (
                            <span
                              title="خوانده‌نشده"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "999px",
                                backgroundColor: "#ef4444",
                                display: "inline-block",
                              }}
                            />
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: "11px",
                            color: t.assignedAdmin ? "#93c5fd" : "#6b7280",
                            fontWeight: 400,
                          }}
                        >
                          مسئول: {assignedAdminName}
                        </span>
                      </Link>
                    </div>

                    {/* نوع */}
                    <div style={{ textAlign: "center" }}>
                      <TypeChip type={t.type} />
                    </div>

                    {/* وضعیت */}
                    <div style={{ textAlign: "center" }}>
                      <StatusChip status={t.status} />
                    </div>

                    {/* آخرین فعالیت */}
                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span style={{ opacity: 0.85 }}>
                        {new Date(lastAt).toLocaleString("fa-IR")}
                      </span>
                      <span
                        style={{
                          opacity: 0.6,
                          fontSize: "11px",
                        }}
                      >
                        {relativeDate(lastAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* صفحه‌بندی */}
        {totalItems > 0 && (
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: page === 1 ? "#111827" : "#1f2937",
                color: "#e5e7eb",
                cursor: page === 1 ? "default" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
              }}
            >
              قبلی
            </button>
            <span style={{ color: "#9ca3af" }}>
              صفحه {page} از {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: page === totalPages ? "#111827" : "#1f2937",
                color: "#e5e7eb",
                cursor: page === totalPages ? "default" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
