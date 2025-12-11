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
import MessagesList from "./MessagesList.client";
export const dynamic = "force-dynamic";

/* ========= انواع ========= */
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

// اطلاعات کاربر که (ترجیحاً) بک‌اند همراه تیکت برگرداند
type TicketUser = {
  id?: string | null;
  phone?: string | null;
  fullName?: string | null;
  gender?: "male" | "female" | "other" | null;
  birthDate?: string | null; // yyyy-mm-dd یا ISO
  plan?: "free" | "pro" | "vip" | null;
  planExpiresAt?: string | null; // ISO
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

  // ⭐ فیلدهای جدید / اختیاری برای اطلاعات کاربر
  openedById?: string | null; // مثلاً phone یا userId
  user?: TicketUser | null;
};

/* ========= کمک‌ها برای نمایش اطلاعات کاربر ========= */

// تاریخ میلادی / ISO → جلالی کوتاه
function formatJalali(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleDateString("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

type PlanView = {
  label: string;
  colorBg: string;
  colorText: string;
  daysLeft: number | null;
  status: "free" | "pro" | "expiring" | "expired";
};

function computePlanView(
  plan?: string | null,
  planExpiresAt?: string | null
): PlanView {
  const base: PlanView = {
    label: "FREE",
    colorBg: "#111827",
    colorText: "#E5E7EB",
    daysLeft: null,
    status: "free",
  };

  if (!plan || plan === "free") return base;

  // pro / vip
  let status: PlanView["status"] = "pro";
  let label = plan.toUpperCase();
  let colorBg = "#064E3B";
  let colorText = "#4ADE80";
  let daysLeft: number | null = null;

  if (planExpiresAt) {
    const now = Date.now();
    const exp = new Date(planExpiresAt).getTime();
    if (!Number.isNaN(exp)) {
      const diffMs = exp - now;
      const oneDay = 24 * 60 * 60 * 1000;
      daysLeft = Math.ceil(diffMs / oneDay);

      if (daysLeft <= 0) {
        status = "expired";
        colorBg = "#7F1D1D";
        colorText = "#FCA5A5";
        label = "EXPIRED";
      } else if (daysLeft <= 7) {
        status = "expiring";
        colorBg = "#451A03";
        colorText = "#FBBF24";
      }
    }
  }

  return { label, colorBg, colorText, daysLeft, status };
}

function formatGender(g?: TicketUser["gender"]): string {
  if (!g) return "نامشخص";
  if (g === "male") return "مرد";
  if (g === "female") return "زن";
  return "سایر";
}

/* ========= گرفتن اطلاعات تیکت ========= */
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

  // json.ticket می‌تواند حاوی user و openedById هم باشد
  return json.ticket as Ticket;
}

/* ========= اکشن‌های سروری ========= */
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

/* ========= صفحه جزئیات ========= */
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

  const userFromTicket = ticket.user || {};
  const userPhone =
    userFromTicket.phone || ticket.contact || ticket.openedById || "نامشخص";
  const userName =
    userFromTicket.fullName || ticket.openedByName || ticket.title || "کاربر";

  const planView = computePlanView(
    userFromTicket.plan,
    userFromTicket.planExpiresAt
  );

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
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ردیف بالا: برگشت + زمان ایجاد */}
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

          {/* عنوان + سنجاق + نوع + وضعیت */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
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

          {/* ⭐ هدر اطلاعات کاربر – چسبان بالای لیست پیام‌ها */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              marginBottom: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.5))",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                rowGap: 6,
                columnGap: 16,
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ opacity: 0.7 }}>شماره تماس: </span>
                <span style={{ fontWeight: 700 }}>{userPhone}</span>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>جنسیت: </span>
                <span style={{ fontWeight: 700 }}>
                  {formatGender(userFromTicket.gender)}
                </span>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>تاریخ تولد: </span>
                <span style={{ fontWeight: 700 }}>
                  {formatJalali(userFromTicket.birthDate)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: planView.colorBg,
                    border: "1px solid rgba(148,163,184,0.5)",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  <span style={{ color: planView.colorText }}>
                    {planView.label}
                  </span>
                </div>
                {planView.daysLeft !== null && planView.daysLeft >= 0 && (
                  <span style={{ opacity: 0.8 }}>
                    {planView.status === "expired"
                      ? "منقضی شده"
                      : `${planView.daysLeft} روز مانده`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* خط جداکننده زیر هدر اطلاعات */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to left, transparent, #374151, transparent)",
              marginBottom: "10px",
            }}
          />

          {/* لیست پیام‌ها – با اسکرول خودکار تا آخرین پیام */}
          <MessagesList
            messages={ticket.messages || []}
            backendBase={backendBase}
            userName={userName}
          />

          {/* نوار ارسال پاسخ */}
          <div>
            <ReplyBar />
          </div>
        </div>
      </main>
    </div>
  );
}