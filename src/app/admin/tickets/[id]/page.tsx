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

/* ===== انواع داده ===== */

type AdminMessage = {
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

type TicketUser = {
  id?: string;
  phone?: string | null;
  fullName?: string | null;
  gender?: "male" | "female" | "other" | null;
  birthDate?: string | null; // ISO
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
  messages: AdminMessage[];
  pinned?: boolean;
  unread?: boolean;
  openedByName?: string | null;
  openedById?: string | null;
  user?: TicketUser | null;
};

/* ===== توابع کمکی ===== */

function formatJalali(input?: string | null) {
  if (!input) return "نامشخص";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "نامشخص";
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

function formatJalaliWithTime(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return d.toISOString();
  }
}

function genderLabel(g?: TicketUser["gender"]) {
  if (g === "male") return "مرد";
  if (g === "female") return "زن";
  if (g === "other") return "سایر";
  return "نامشخص";
}

function planLabel(u?: TicketUser | null): {
  chipText: string;
  chipKind: "free" | "pro" | "expired";
  description: string;
} {
  if (!u?.plan) {
    return {
      chipText: "FREE",
      chipKind: "free",
      description: "بدون اشتراک فعال",
    };
  }

  const plan = u.plan;
  const rawExp = u.planExpiresAt ?? null;
  const now = Date.now();
  const exp = rawExp ? new Date(rawExp) : null;
  const expired = exp ? exp.getTime() < now : false;
  const daysLeft =
    exp && !expired
      ? Math.max(
          0,
          Math.floor((exp.getTime() - now) / (1000 * 60 * 60 * 24))
        )
      : null;

  if (plan === "pro" || plan === "vip") {
    if (expired) {
      return {
        chipText: "EXPIRED",
        chipKind: "expired",
        description: "اشتراک منقضی شده",
      };
    }
    if (daysLeft != null) {
      return {
        chipText: "PRO",
        chipKind: "pro",
        description: `اشتراک فعال – ${daysLeft} روز باقی‌مانده`,
      };
    }
    return {
      chipText: "PRO",
      chipKind: "pro",
      description: "اشتراک فعال",
    };
  }

  return {
    chipText: "FREE",
    chipKind: "free",
    description: "بدون اشتراک فعال",
  };
}

/* ===== API: گرفتن تیکت ===== */

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

/* ===== اکشن‌های سروری ===== */

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

/* ===== صفحه جزئیات ===== */

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

  const u = ticket.user || null;

  const userName = ticket.openedByName || ticket.title || "کاربر";
  const phone =
    u?.phone || ticket.contact || ticket.openedById || "نامشخص";

  const gender = genderLabel(u?.gender ?? undefined);
  const birthDateLabel = formatJalali(u?.birthDate ?? null);
  const planInfo = planLabel(u);

  const statusIcon =
    ticket.status === "open" ? (
      <CheckCircleIcon className="w-5 h-5 text-green-400" />
    ) : ticket.status === "pending" ? (
      <ClockIcon className="w-5 h-5 text-yellow-400" />
    ) : (
      <LockClosedIcon className="w-5 h-5 text-gray-400" />
    );

  let planBg = "#111827";
  let planColor = "#E5E7EB";
  if (planInfo.chipKind === "pro") {
    planBg = "#064E3B";
    planColor = "#4ADE80";
  } else if (planInfo.chipKind === "expired") {
    planBg = "#7F1D1D";
    planColor = "#FCA5A5";
  }

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
          alignItems: "stretch",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* کارت اصلی با ارتفاع ثابت در صفحه */}
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "20px 22px 18px",
            borderRadius: "18px",
            border: "1px solid #333",
            backgroundColor: "#050505",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 80px)",
          }}
        >
          {/* هدر بالای کارت (ثابت) */}
          <div
            style={{
              marginBottom: "10px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* ردیف بالا: فلش برگشت + تاریخ ایجاد */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Link
                href="/admin/tickets"
                aria-label="بازگشت به لیست تیکت‌ها"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.6)",
                  background:
                    "radial-gradient(circle at 30% 30%, #0f172a, #020617)",
                  color: "rgba(248,250,252,0.9)",
                }}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>

              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(249,250,251,0.7)",
                  textAlign: "left",
                }}
              >
                ایجاد: {formatJalaliWithTime(ticket.createdAt)}
              </div>
            </div>

            {/* نام کاربر + سنجاق + وضعیت */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                      ticket.pinned
                        ? "برداشتن سنجاق"
                        : "سنجاق‌کردن این تیکت"
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
                  <input
                    type="hidden"
                    name="current"
                    value={ticket.status}
                  />
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

            {/* ردیف اطلاعات کاربر – نوار آبی */}
            <div
              style={{
                borderRadius: "999px",
                padding: "8px 16px",
                background:
                  "linear-gradient(90deg, #020617, #020617 10%, #020b3a 60%, #020617 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                columnGap: 16,
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "rgba(248,250,252,0.9)",
                }}
              >
                <span>جنسیت: {gender}</span>
                <span>تاریخ تولد: {birthDateLabel}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ whiteSpace: "nowrap" }}>
                  شماره تماس: <strong>{phone}</strong>
                </span>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.5)",
                    backgroundColor: planBg,
                    color: planColor,
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  {planInfo.chipText}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(209,213,219,0.9)",
                  }}
                >
                  {planInfo.description}
                </span>
              </div>
            </div>

            {/* خط جداکننده زیر هدر */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(to left, transparent, #374151, transparent)",
              }}
            />
          </div>

          {/* بدنه کارت: پیام‌ها (اسکرول) + نوار پاسخ ثابت پایین */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* لیست پیام‌ها – فقط این بخش اسکرول می‌خورد */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                marginBottom: 8,
              }}
            >
              <MessagesList
                messages={ticket.messages}
                userName={userName}
                backendBase={backendBase}
              />
            </div>

            {/* ReplyBar – همیشه پایین کارت */}
            <div
              style={{
                borderTop: "1px solid #1f2933",
                paddingTop: 8,
              }}
            >
              <ReplyBar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}