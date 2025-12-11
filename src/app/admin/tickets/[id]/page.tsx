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

type AdminUser = {
  id: string;
  phone: string;
  fullName?: string | null;
  gender?: "male" | "female" | "other" | null;
  birthDate?: string | null; // yyyy-mm-dd
  plan?: "free" | "pro" | "vip" | null;
  planExpiresAt?: string | null;
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
  openedById?: string | null;
  user?: AdminUser | null;
};

/* ========= کمک‌ها ========= */

function toJalaliDate(input?: string | null) {
  if (!input) return "نامشخص";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "نامشخص";
  try {
    return d.toLocaleDateString("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "نامشخص";
  }
}

function genderLabel(g?: AdminUser["gender"]) {
  if (g === "male") return "مرد";
  if (g === "female") return "زن";
  if (g === "other") return "سایر";
  return "نامشخص";
}

function computePlanView(user?: AdminUser | null) {
  if (!user?.plan || user.plan === "free")
    return { badge: "FREE", daysLabel: "بدون اشتراک فعال" };

  const expires = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  if (!expires || isNaN(expires.getTime()))
    return { badge: "PRO", daysLabel: "تاریخ نامشخص" };

  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0)
    return { badge: "EXPIRED", daysLabel: "منقضی شده" };

  return {
    badge: "PRO",
    daysLabel: `${days} روز باقی‌مانده`,
  };
}

/* ========= اکشن‌های سروری ========= */

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

  const user = ticket.user ?? null;
  const userName = ticket.openedByName || user?.fullName || ticket.title || "کاربر";
  const phone = user?.phone || ticket.contact || ticket.openedById || "—";
  const birthLabel = toJalaliDate(user?.birthDate);
  const gender = genderLabel(user?.gender);
  const planInfo = computePlanView(user);

  const statusIcon =
    ticket.status === "open" ? (
      <CheckCircleIcon className="w-5 h-5 text-green-400" />
    ) : ticket.status === "pending" ? (
      <ClockIcon className="w-5 h-5 text-yellow-400" />
    ) : (
      <LockClosedIcon className="w-5 h-5 text-gray-400" />
    );

  const createdLabel =
    new Date(ticket.createdAt).toLocaleString("fa-IR-u-ca-persian") || "—";

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
        {/* کارت اصلی */}
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
            maxHeight: "80vh",
          }}
        >
          {/* هدر بالای کارت (ثابت) */}
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            {/* ردیف بالا: فلش برگشت + تاریخ ایجاد */}
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
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  border: "1px solid rgba(75,85,99,0.9)",
                  backgroundColor: "#020617",
                }}
              >
                <ArrowLeftIcon
                  className="w-5 h-5"
                  style={{ transform: "rotate(180deg)" }}
                />
              </Link>

              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(249,250,251,0.7)",
                  textAlign: "left",
                }}
              >
                ایجاد: {createdLabel}
              </div>
            </div>

            {/* ردیف دوم: نام کاربر + سنجاق + نوع تیکت + وضعیت */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
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
                  {ticket.type === "tech"
                    ? "پشتیبانی فنی"
                    : "ارتباط با درمانگر"}
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

            {/* نوار آبی اطلاعات کاربر */}
            <div
              style={{
                width: "100%",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, #0b1120, #111827, #020617)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "rgba(226,232,240,0.9)",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ opacity: 0.85 }}>شماره تماس:</span>
                <span style={{ fontWeight: 800 }}>{phone}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>
                  جنسیت:{" "}
                  <strong style={{ fontWeight: 800 }}>{gender}</strong>
                </span>
                <span>
                  تاریخ تولد:{" "}
                  <strong style={{ fontWeight: 800 }}>{birthLabel}</strong>
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.9)",
                    fontWeight: 800,
                    fontSize: "10px",
                  }}
                >
                  {planInfo.badge}
                </span>
                <span style={{ opacity: 0.85 }}>{planInfo.daysLabel}</span>
              </div>
            </div>

            {/* خط جداکننده نازک */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(to left, transparent, #374151, transparent)",
              }}
            />
          </div>

          {/* بدنه کارت: لیست پیام‌ها + نوار پاسخ */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* لیست پیام‌ها – فقط این بخش اسکرول می‌شود */}
            <MessagesList
              messages={ticket.messages}
              userName={userName}
              backendBase={backendBase}
            />

            {/* نوار ارسال پاسخ */}
            <div style={{ marginTop: 8 }}>
              <ReplyBar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}