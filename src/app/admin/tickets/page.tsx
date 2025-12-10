"use client";
import { useEffect, useMemo, useState } from "react";
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
  userName?: string | null;
  displayName?: string | null;
  contact?: string | { name?: string };
  email?: string;
  phone?: string;
  updatedAt?: string;
  messages?: Array<{ id: string; createdAt: string; sender?: "user" | "admin" }>;
  lastAt?: string;
  _lastSender?: "user" | "admin" | null;
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

function extractLastAt(t: any): string {
  const fromUpdated =
    t?.updatedAt && !isNaN(Date.parse(t.updatedAt)) ? t.updatedAt : null;
  const lastMsgAt =
    Array.isArray(t?.messages) && t.messages.length
      ? t.messages[t.messages.length - 1]?.createdAt
      : null;
  const fromCreated = t?.createdAt;
  const iso =
    (lastMsgAt && !isNaN(Date.parse(lastMsgAt)) && lastMsgAt) ||
    (fromUpdated && fromUpdated) ||
    fromCreated;
  return iso;
}

function extractLastSender(t: any): "user" | "admin" | null {
  if (Array.isArray(t?.messages) && t.messages.length) {
    const s = t.messages[t.messages.length - 1]?.sender;
    if (s === "user" || s === "admin") return s as "user" | "admin";
  }
  return null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    "" | "open" | "pending" | "closed" | "unread"
  >("");
  const [type, setType] = useState<"" | "tech" | "therapy">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));

  const pagedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, page]);

  const query = useMemo(
    () => buildQuery({ status, type, q }),
    [status, type, q]
  );

  async function fetchTickets() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tickets${query}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        const withDisplay: Ticket[] = (data.tickets as Ticket[]).map(
          (t: any) => {
            const fallbackFromContact =
              (typeof t.contact === "object"
                ? t.contact?.name
                : t.contact) || t.email || t.phone || null;
            const displayName =
              (t as any).userName ||
              (t as any).displayName ||
              fallbackFromContact ||
              t.title ||
              "—";
            const lastAt = extractLastAt(t);
            const _lastSender = extractLastSender(t);
            return { ...(t as Ticket), displayName, lastAt, _lastSender };
          }
        );
        const filtered =
          status === "unread"
            ? withDisplay.filter((t) => t.unread)
            : withDisplay;
        const sorted = filtered.slice().sort((a, b) => {
          const pinOrder = Number(!!b.pinned) - Number(!!a.pinned);
          if (pinOrder !== 0) return pinOrder;
          const aTime = new Date(a.lastAt || a.createdAt).getTime();
          const bTime = new Date(b.lastAt || b.createdAt).getTime();
          return bTime - aTime;
        });
        setTickets(sorted);
        setPage(1);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
    const t = setInterval(fetchTickets, 50000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function markReadOptimistic(ticketId: string) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, unread: false } : t))
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

  const statusChip = (s: Ticket["status"]) => {
    const map = {
      open: { bg: "bg-blue-900/40", text: "text-blue-300", label: "باز" },
      pending: {
        bg: "bg-yellow-900/40",
        text: "text-yellow-300",
        label: "در انتظار",
      },
      closed: {
        bg: "bg-green-900/40",
        text: "text-green-300",
        label: "بسته",
      },
    } as const;
    const c = map[s];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  const typeChip = (t: Ticket["type"]) => {
    const map = {
      tech: {
        bg: "bg-sky-900/40",
        text: "text-sky-300",
        label: "پشتیبانی فنی",
      },
      therapy: {
        bg: "bg-purple-900/40",
        text: "text-purple-300",
        label: "ارتباط با درمانگر",
      },
    } as const;
    const c = map[t];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  return (
    // 🔹 همون شِل کلی شبیه صفحه لاگین: پس‌زمینه گرادیانی + سنتر کارت
    <div className="min-h-[calc(100vh-72px)] px-4 md:px-6 py-6 flex items-center justify-center bg-[radial-gradient(circle_at_top,_#111827,_#020617)]">
      {/* کارت اصلی محتوا (همون چیزی که قبلاً داشتی) */}
      <div className="w-full max-w-6xl text-white space-y-4">
        {/* عنوان و خلاصه */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🎫 لیست تیکت‌ها</h1>
            <p className="mt-1 text-sm text-white/60">
              اینجا تمام تیکت‌های کاربران را می‌بینی و می‌توانی آن‌ها را مدیریت کنی.
            </p>
          </div>
          <span className="rounded-full border border-[#333] bg-[#0b0b0b] px-3 py-1 text-xs text-white/70">
            مجموع تیکت‌ها:{" "}
            <span className="font-semibold text-orange-400">{tickets.length}</span>
          </span>
        </div>

        {/* کارت فیلتر + لیست */}
        <div className="rounded-2xl border border-[#222] bg-[#050505]/95 backdrop-blur-md p-4 md:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.7)] space-y-4">
          {/* فیلترها */}
          <div className="grid gap-3 md:grid-cols-4 md:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm opacity-80">وضعیت</label>
              <select
                className="bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="">همه</option>
                <option value="open">باز</option>
                <option value="pending">در انتظار</option>
                <option value="closed">بسته</option>
                <option value="unread">خوانده‌نشده</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm opacity-80">نوع</label>
              <select
                className="bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="">همه</option>
                <option value="tech">پشتیبانی فنی</option>
                <option value="therapy">ارتباط با درمانگر</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm opacity-80">جستجو</label>
              <input
                className="w-full bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                placeholder="نام کاربر، توضیح یا راه ارتباط…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-white/50">
              ردیف‌های سنجاق‌شده همیشه بالاتر از بقیه نمایش داده می‌شوند.
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchTickets}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-sm font-semibold"
              >
                اعمال فیلتر
              </button>
              <button
                onClick={() => {
                  setStatus("");
                  setType("");
                  setQ("");
                }}
                className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-sm"
              >
                پاک‌سازی
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-l from-transparent via-[#333] to-transparent" />

          {/* محتوا */}
          {loading ? (
            <p className="p-4 text-sm text-white/70">⏳ در حال بارگذاری...</p>
          ) : tickets.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-[#333] bg-black/40 text-sm text-white/70 text-center">
              هیچ تیکتی پیدا نشد.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-[#222] bg-black/40">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#101010] text-xs text-white/70">
                    <th className="border-b border-[#222] px-3 py-2 text-center">
                      کاربر
                    </th>
                    <th className="border-b border-[#222] px-3 py-2 text-center">
                      نوع
                    </th>
                    <th className="border-b border-[#222] px-3 py-2 text-center">
                      وضعیت
                    </th>
                    <th className="border-b border-[#222] px-3 py-2 text-center">
                      آخرین فعالیت
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.map((t) => {
                    const nameToShow =
                      t.userName || t.displayName || t.title || "—";
                    const lastAt = t.lastAt || t.createdAt;
                    const isUnread = !!t.unread;
                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          isUnread ? "bg-[#111]" : "bg-transparent"
                        } hover:bg-[#181818]`}
                      >
                        <td className="border-t border-[#222] px-3 py-2 text-center">
                          <Link
                            href={`/admin/tickets/${t.id}`}
                            className="text-orange-400 hover:text-orange-300 hover:underline inline-flex items-center justify-center gap-1"
                            onClick={() => markReadOptimistic(t.id)}
                          >
                            {t.pinned ? (
                              <span
                                className="text-yellow-400 text-xs"
                                title="سنجاق‌شده"
                              >
                                ★
                              </span>
                            ) : null}
                            <span className={isUnread ? "font-semibold" : ""}>
                              {nameToShow}
                            </span>
                            {isUnread ? (
                              <span
                                className="inline-block w-2 h-2 rounded-full bg-red-500"
                                title="خوانده‌نشده"
                              />
                            ) : null}
                          </Link>
                        </td>
                        <td className="border-t border-[#222] px-3 py-2 text-center">
                          {typeChip(t.type)}
                        </td>
                        <td className="border-t border-[#222] px-3 py-2 text-center">
                          {statusChip(t.status)}
                        </td>
                        <td className="border-t border-[#222] px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="opacity-80">
                              {new Date(lastAt).toLocaleString("fa-IR")}
                            </span>
                            <span className="opacity-60 text-xs">
                              {relativeDate(lastAt)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* صفحه‌بندی */}
        {tickets.length > 0 && (
          <div className="mt-1 flex items-center justify-center gap-2 text-sm">
            <button
              className="px-3 py-1 rounded-lg bg-[#222] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#222]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              قبلی
            </button>
            <span className="px-2 text-white/70">
              صفحه {page} از {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded-lg bg-[#222] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#222]"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}