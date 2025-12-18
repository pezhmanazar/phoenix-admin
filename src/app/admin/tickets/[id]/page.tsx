// src/app/admin/tickets/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import ReplyBar from "./ReplyBar.client";
import MessagesList from "./MessagesList.client";
import TicketAutoRefresh from "./TicketAutoRefresh.client";
import TicketHeader from "./TicketHeader";

// ✅ کنترل‌ها
import DeleteTicketButton from "./DeleteTicketButton.client";
import {
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

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
function normalizeBase(url?: string | null): string {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
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

function planLabel(u?: TicketUser | null): { chipText: string; description: string } {
  const plan = u?.plan || "free";
  const rawExp = u?.planExpiresAt ?? null;
  const now = Date.now();
  const exp = rawExp ? new Date(rawExp) : null;
  const expired = exp ? exp.getTime() < now : false;

  if (plan === "pro" || plan === "vip") {
    if (expired) return { chipText: "EXPIRED", description: "اشتراک منقضی شده" };

    if (exp) {
      const daysLeft = Math.max(
        0,
        Math.floor((exp.getTime() - now) / (1000 * 60 * 60 * 24))
      );
      return {
        chipText: plan === "vip" ? "VIP" : "PRO",
        description: `اشتراک فعال – ${daysLeft} روز باقی‌مانده`,
      };
    }

    return {
      chipText: plan === "vip" ? "VIP" : "PRO",
      description: "اشتراک فعال",
    };
  }

  return { chipText: "FREE", description: "بدون اشتراک فعال" };
}

function calcAgeLabel(birthDate?: string | null): string {
  if (!birthDate) return "سن نامشخص";
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return "سن نامشخص";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mDiff = now.getMonth() - d.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) age--;
  if (age < 0 || age > 120) return "سن نامشخص";
  return `${age.toLocaleString("fa-IR")} سال`;
}

/* ===== API: گرفتن تیکت ===== */
async function fetchTicket(id: string): Promise<Ticket | null> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) redirect(`/admin/login?redirect=/admin/tickets/${id}`);

  const internalBase = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";

  const res = await fetch(`${internalBase}/api/admin/tickets/${id}`, {
    headers: { "x-admin-token": token, Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 401) redirect(`/admin/login?redirect=/admin/tickets/${id}`);
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
      Accept: "application/json",
    },
    body: JSON.stringify({ pinned: to === "true" }),
    cache: "no-store",
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
    current === "open" ? "pending" : current === "pending" ? "closed" : "open";

  const base = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";

  await fetch(`${base}/api/admin/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "x-admin-token": token,
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: next }),
    cache: "no-store",
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

  const backendMediaBase =
    normalizeBase(process.env.NEXT_PUBLIC_UPLOAD_BASE) ||
    normalizeBase(process.env.NEXT_PUBLIC_BACKEND_MEDIA_BASE) ||
    normalizeBase(process.env.BACKEND_PUBLIC_URL) ||
    "";

  const u = ticket.user || null;

  // ✅ اولویت: دیتای واقعی user
  const userName = u?.fullName || ticket.openedByName || ticket.title || "کاربر";
  const phone = u?.phone || ticket.contact || ticket.openedById || "نامشخص";
  const planInfo = planLabel(u);
  const ageLabel = calcAgeLabel(u?.birthDate ?? null);

  const statusIcon =
    ticket.status === "open" ? (
      <CheckCircleIcon className="w-4 h-4 text-green-400" />
    ) : ticket.status === "pending" ? (
      <ClockIcon className="w-4 h-4 text-yellow-400" />
    ) : (
      <LockClosedIcon className="w-4 h-4 text-gray-400" />
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
          alignItems: "stretch",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
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
          {/* 🔄 رفرش مخفی */}
          <TicketAutoRefresh intervalMs={10000} />

          {/* هدر */}
          <div style={{ marginBottom: 10 }}>
            <TicketHeader
              userName={userName}
              phone={phone}
              ageLabel={ageLabel}
              gender={u?.gender ?? null}
              planChipText={planInfo.chipText}
              planDescription={planInfo.description}
              ticketType={ticket.type}
            />

            {/* ردیف کنترل‌ها: ایجاد + پین + وضعیت + حذف */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 10,
                color: "rgba(209,213,219,0.85)",
              }}
            >
              <div>ایجاد: {formatJalaliWithTime(ticket.createdAt)}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* پین */}
                <form action={togglePinAction}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="to" value={(!ticket.pinned).toString()} />
                  <button
                    type="submit"
                    title={ticket.pinned ? "برداشتن سنجاق" : "سنجاق‌کردن این تیکت"}
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
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <StarOutline className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </form>

                {/* وضعیت */}
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

                {/* حذف */}
                <DeleteTicketButton ticketId={ticket.id} />
              </div>
            </div>

            {/* خط جداکننده */}
            <div
              style={{
                marginTop: 8,
                height: 1,
                background: "linear-gradient(to left, transparent, #374151, transparent)",
              }}
            />
          </div>

          {/* بدنه */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, marginBottom: 8 }}>
              <MessagesList
                messages={ticket.messages}
                userName={userName}
                backendBase={backendMediaBase}
              />
            </div>

            <div style={{ borderTop: "1px solid #1f2933", paddingTop: 8 }}>
              {/* ✅ ticketId حتما پاس داده شود */}
              <ReplyBar ticketId={ticket.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}