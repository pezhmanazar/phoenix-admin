// src/app/admin/tickets/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReplyBar from "./ReplyBar.client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import VoicePlayer from "./VoicePlayer.client";

export const dynamic = "force-dynamic";

type Message = {
  id: string;
  ticketId: string;
  sender: "user" | "admin";
  text?: string | null;
  createdAt?: string;
  ts?: string;
  type?: "text" | "voice" | "image" | "file";
  fileUrl?: string | null;
  mime?: string | null;
  durationSec?: number | null;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  contact?: string | null;
  status: "open" | "pending" | "closed";
  type: "tech" | "therapy";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  pinned?: boolean;
  unread?: boolean;
  openedByName?: string | null;
};

// 🟢 گرفتن اطلاعات تیکت
async function fetchTicket(id: string): Promise<Ticket | null> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) redirect(`/admin/login?redirect=/admin/tickets/${id}`);

  const base = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";
  const res = await fetch(`${base}/api/admin/tickets/${id}`, {
    headers: { "x-admin-token": token },
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect(`/admin/login?redirect=/admin/tickets/${id}`);
  }
  if (res.status === 404) return null;

  const json = await res.json().catch(() => null);
  if (!json?.ok) return null;
  return json.ticket as Ticket;
}

/* ⭐ اکشن‌های سروری */
async function togglePinAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const to = String(formData.get("to") || "");
  const token = (await cookies()).get("admin_token")?.value || "";
  if (!id || !token) return;

  const base = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";
  await fetch(`${base}/api/admin/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "x-admin-token": token,
      "content-type": "application/json",
    },
    body: JSON.stringify({ pinned: to === "true" }),
  }).catch(() => {});
  revalidatePath(`/admin/tickets/${id}`);
}

async function cycleStatusAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const current = String(formData.get("current") || "");
  const token = (await cookies()).get("admin_token")?.value || "";
  if (!id || !token) return;

  const next =
    current === "open"
      ? "pending"
      : current === "pending"
      ? "closed"
      : "open";

  const base = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";
  await fetch(`${base}/api/admin/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "x-admin-token": token,
      "content-type": "application/json",
    },
    body: JSON.stringify({ status: next }),
  }).catch(() => {});
  revalidatePath(`/admin/tickets/${id}`);
}

// 🧡 صفحه جزئیات
export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await fetchTicket(id);
  if (!ticket) return notFound();

  const backendBase =
    process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";
  const userName = ticket.openedByName || ticket.title || "کاربر";

  const statusIcon =
    ticket.status === "open" ? (
      <CheckCircleIcon className="w-5 h-5 text-green-400" />
    ) : ticket.status === "pending" ? (
      <ClockIcon className="w-5 h-5 text-yellow-400" />
    ) : (
      <LockClosedIcon className="w-5 h-5 text-gray-400" />
    );

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
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        {/* کارت اصلی مثل لاگین */}
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            padding: "20px 22px 18px",
            borderRadius: "18px",
            border: "1px solid #333",
            backgroundColor: "#050505",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
          }}
        >
          {/* ردیف بالا: برگشت + خلاصه وضعیت */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <Link
              href="/admin/tickets"
              aria-label="بازگشت به لیست تیکت‌ها"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "13px",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
              }}
            >
              <ArrowLeftIcon
                className="w-5 h-5"
                style={{ transform: "rotate(180deg)" }}
              />
              <span>بازگشت به تیکت‌ها</span>
            </Link>

            <div
              style={{
                fontSize: "11px",
                color: "rgba(249,250,251,0.7)",
                textAlign: "left",
              }}
            >
              ایجاد:{" "}
              {new Date(ticket.createdAt).toLocaleString("fa-IR") || "—"}
            </div>
          </div>

          {/* عنوان + نوع + سنجاق + وضعیت */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              <span>{userName}</span>
              <form action={togglePinAction}>
                <input type="hidden" name="id" value={ticket.id} />
                <input
                  type="hidden"
                  name="to"
                  value={(!ticket.pinned).toString()}
                />
                <button
                  type="submit"
                  title={
                    ticket.pinned ? "برداشتن سنجاق" : "سنجاق‌کردن این تیکت"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {ticket.pinned ? (
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <StarOutline className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </form>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border: "1px solid rgba(55,65,81,0.8)",
                  backgroundColor:
                    ticket.type === "tech" ? "#0f172a" : "#1f2937",
                  color:
                    ticket.type === "tech"
                      ? "rgba(96,165,250,0.9)"
                      : "rgba(196,181,253,0.9)",
                }}
              >
                {ticket.type === "tech" ? "پشتیبانی فنی" : "ارتباط با درمانگر"}
              </span>

              <form action={cycleStatusAction}>
                <input type="hidden" name="id" value={ticket.id} />
                <input type="hidden" name="current" value={ticket.status} />
                <button
                  type="submit"
                  title={
                    ticket.status === "open"
                      ? "باز (کلیک برای در انتظار)"
                      : ticket.status === "pending"
                      ? "در انتظار (کلیک برای بسته)"
                      : "بسته (کلیک برای باز)"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {statusIcon}
                </button>
              </form>
            </div>
          </div>

          {/* خط جداکننده */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to left, transparent, #374151, transparent)",
              marginBottom: "10px",
            }}
          />

          {/* لیست پیام‌ها */}
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {ticket.messages?.length ? (
              ticket.messages.map((m) => {
                const mine = m.sender === "admin";
                const when = m.createdAt || m.ts;
                const type = m.type || "text";
                const rel = (m.fileUrl || "").toString();
                const hasFile = rel && rel.startsWith("/");
                const fullUrl = hasFile ? `${backendBase}${rel}` : null;
                const senderLabel = mine ? "پشتیبانی ققنوس" : userName;

                const bubbleStyle: React.CSSProperties = {
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  border: "1px solid",
                  borderColor: mine ? "#ea580c" : "#333",
                  backgroundColor: mine ? "#ea580c" : "#000",
                  alignSelf: mine ? "flex-start" : "flex-end",
                  fontSize: "13px",
                };

                const metaStyle: React.CSSProperties = {
                  fontSize: "11px",
                  marginBottom: 4,
                  color: mine
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(249,250,251,0.7)",
                };

                return (
                  <div key={m.id} style={bubbleStyle}>
                    <div style={metaStyle}>
                      {senderLabel}
                      {when ? (
                        <span style={{ marginInline: 6, opacity: 0.7 }}>
                          • {new Date(when).toLocaleString("fa-IR")}
                        </span>
                      ) : null}
                    </div>

                    {m.text ? (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          marginBottom:
                            type === "text" || !fullUrl ? 0 : 6,
                        }}
                      >
                        {m.text}
                      </div>
                    ) : null}

                    {type === "image" && fullUrl ? (
                      <img
                        src={fullUrl}
                        alt="image"
                        style={{
                          maxHeight: "280px",
                          borderRadius: "10px",
                          border: "1px solid #374151",
                          marginTop: m.text ? 6 : 0,
                        }}
                      />
                    ) : type === "voice" && fullUrl ? (
                      <div style={{ marginTop: 4 }}>
                        <VoicePlayer src={fullUrl} />
                      </div>
                    ) : type === "file" && fullUrl ? (
                      <a
                        href={fullUrl}
                        target="_blank"
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.9)",
                          textDecoration: "underline",
                        }}
                      >
                        دانلود فایل
                      </a>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(156,163,175,0.9)",
                }}
              >
                هنوز پیامی ثبت نشده.
              </div>
            )}
          </div>

          {/* نوار ارسال پاسخ */}
          <div>
            <ReplyBar />
          </div>
        </div>
      </main>
    </div>
  );
}