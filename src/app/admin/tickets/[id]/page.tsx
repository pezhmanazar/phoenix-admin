// src/app/admin/tickets/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import ReplyBar from "./ReplyBar.client";
import MessagesList from "./MessagesList.client";
import TicketAutoRefresh from "./TicketAutoRefresh.client";
import TicketHeader from "./TicketHeader";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(1200px 700px at 20% -10%, rgba(212,175,55,0.10), transparent 60%)," +
          "radial-gradient(900px 600px at 90% 10%, rgba(233,138,21,0.10), transparent 55%)," +
          "linear-gradient(180deg, #000 0%, #05070b 100%)",
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
            maxWidth: "980px",
            margin: "0 auto",
            padding: "18px 18px 14px",
            borderRadius: "22px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10,10,12,0.72)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 80px)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* 🔄 رفرش مخفی */}
          <TicketAutoRefresh intervalMs={10000} />

          {/* هدر */}
          <div style={{ marginBottom: 10 }}>
            <TicketHeader
              ticketId={ticket.id}
              pinned={!!ticket.pinned}
              userName={userName}
              phone={phone}
              ageLabel={ageLabel}
              gender={u?.gender ?? null}
              planChipText={planInfo.chipText}
              planDescription={planInfo.description}
              ticketType={ticket.type}
            />

            {/* ردیف کوچک فقط برای تاریخ ایجاد (بدون کنترل) */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontSize: 10,
                color: "rgba(209,213,219,0.75)",
              }}
            >
              ایجاد: {formatJalaliWithTime(ticket.createdAt)}
            </div>

            {/* خط جداکننده */}
            <div
              style={{
                marginTop: 10,
                height: 1,
                background:
                  "linear-gradient(to left, transparent, rgba(148,163,184,0.35), transparent)",
              }}
            />
          </div>

          {/* بدنه */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, minHeight: 0, marginBottom: 10 }}>
              <MessagesList
                messages={ticket.messages}
                userName={userName}
                backendBase={backendMediaBase}
              />
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(148,163,184,0.22)",
                paddingTop: 10,
              }}
            >
              <ReplyBar ticketId={ticket.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}