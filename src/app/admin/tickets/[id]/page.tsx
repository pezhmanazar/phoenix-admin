//phoenix-admin\src\app\admin\tickets\[id]\page.tsx

import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import ReplyBar from "./ReplyBar.client";
import MessagesList from "./MessagesList.client";
import TicketHeader from "./TicketHeader";

export const dynamic = "force-dynamic";

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
  birthDate?: string | null;
  plan?: "free" | "pro" | "vip" | null;
  planExpiresAt?: string | null;
};

type TherapySnapshot = {
  baseline?: {
    score?: number;
    percent?: number;
    level?: string | null;
    createdAt?: string | null;
    completedAt?: string | null;
  } | null;
  currentStage?: {
    code?: string;
    title?: string;
    startedAt?: string | null;
    daysInStage?: number;
    stuckOver7d?: boolean;
  } | null;
  treatment?: {
    hasStarted?: boolean;
    startedAt?: string | null;
    introCompletedAt?: string | null;
  } | null;
  subscription?: {
    plan?: string | null;
    expiresAt?: string | null;
    isExpired?: boolean;
    daysLeft?: number | null;
  } | null;
  previousTicketsCount?: number;
  risk?: {
    level?: string | null;
  } | null;
  dates?: {
    userCreatedAt?: string | null;
    treatmentStartedAt?: string | null;
    introCompletedAt?: string | null;
    lastTicketMessageAt?: string | null;
  } | null;
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
  therapySnapshot?: TherapySnapshot | null;
};

function normalizeBase(url?: string | null): string {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
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
      const daysLeft = Math.max(0, Math.floor((exp.getTime() - now) / (1000 * 60 * 60 * 24)));
      return {
        chipText: plan === "vip" ? "VIP" : "PRO",
        description: `اشتراک فعال – ${daysLeft} روز باقی‌مانده`,
      };
    }
    return { chipText: plan === "vip" ? "VIP" : "PRO", description: "اشتراک فعال" };
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

function faNum(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function baselineBadge(level?: string | null): { text: string; color: string } {
  if (level === "severe") return { text: "شدید", color: "#ef4444" };
  if (level === "moderate") return { text: "متوسط", color: "#f59e0b" };
  if (level === "mild") return { text: "خفیف", color: "#22c55e" };
  return { text: "نامشخص", color: "#94a3b8" };
}

function riskBadge(level?: string | null): { text: string; color: string } {
  if (level === "high") return { text: "بالا", color: "#ef4444" };
  if (level === "needs_followup") return { text: "پیگیری", color: "#f59e0b" };
  return { text: "نرمال", color: "#22c55e" };
}

function formatShortDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

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

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await fetchTicket(id);
  if (!ticket) return notFound();

    const backendMediaBase =
    normalizeBase(process.env.NEXT_PUBLIC_UPLOAD_BASE) ||
    normalizeBase(process.env.NEXT_PUBLIC_BACKEND_MEDIA_BASE) ||
    normalizeBase(process.env.BACKEND_PUBLIC_URL) ||
    "";

  const u = ticket.user || null;

  const userName = u?.fullName || ticket.openedByName || ticket.title || "کاربر";
  const phone = u?.phone || ticket.contact || ticket.openedById || "نامشخص";
  const planInfo = planLabel(u);
  const ageLabel = calcAgeLabel(u?.birthDate ?? null);
  const therapy = ticket.therapySnapshot ?? null;
  const baselineInfo = baselineBadge(therapy?.baseline?.level ?? null);
  const riskInfo = riskBadge(therapy?.risk?.level ?? null);

  const showBaseline =
    therapy?.baseline?.score !== undefined || !!therapy?.baseline?.level;

  const showRisk = !!therapy?.risk?.level;

  const showCurrentStage =
    !!therapy?.currentStage?.title ||
    !!therapy?.currentStage?.code ||
    therapy?.currentStage?.daysInStage !== undefined;

  const showPreviousTickets =
    typeof therapy?.previousTicketsCount === "number" && therapy.previousTicketsCount > 0;

  const showSubscription =
    !!therapy?.subscription?.plan && therapy.subscription.plan !== "free";

  const showTreatmentStart =
    !!therapy?.treatment?.startedAt || !!therapy?.dates?.treatmentStartedAt;

  const hasTherapyData =
    showBaseline ||
    showRisk ||
    showCurrentStage ||
    showPreviousTickets ||
    showSubscription ||
    showTreatmentStart;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 800px at 20% 10%, rgba(59,130,246,0.10), transparent 55%), radial-gradient(900px 700px at 80% 20%, rgba(16,185,129,0.10), transparent 60%), #000",
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
            padding: "18px 18px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(5,5,5,0.70)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 22px 55px rgba(0,0,0,0.65)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 80px)",
          }}
        >

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

            {hasTherapyData ? (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {showBaseline && (
                  <div
                    title={`بیس‌لاین: ${therapy?.baseline?.score ?? "—"} از ۳۱ | ${baselineInfo.text}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>📊</span>
                    <span>{faNum(therapy?.baseline?.score ?? "—")}</span>
                    <span style={{ color: baselineInfo.color, fontSize: 11 }}>{baselineInfo.text}</span>
                  </div>
                )}

                {showRisk && (
                  <div
                    title={`ریسک: ${riskInfo.text}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>🚨</span>
                    <span style={{ color: riskInfo.color }}>{riskInfo.text}</span>
                  </div>
                )}

                {showCurrentStage && (
                  <div
                    title={`مرحله فعلی: ${therapy?.currentStage?.title || therapy?.currentStage?.code || "نامشخص"} | ${faNum(therapy?.currentStage?.daysInStage ?? "—")} روز`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                      maxWidth: "100%",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>🪜</span>

                    <span
                      style={{
                        color: "#cbd5e1",
                        fontSize: 11,
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {therapy?.currentStage?.title || therapy?.currentStage?.code || "نامشخص"}
                    </span>

                    <span>{faNum(therapy?.currentStage?.daysInStage ?? "—")}</span>

                    <span
                      style={{
                        color: therapy?.currentStage?.stuckOver7d ? "#ef4444" : "#94a3b8",
                        fontSize: 11,
                      }}
                    >
                      {therapy?.currentStage?.stuckOver7d ? "گیر" : "روز"}
                    </span>
                  </div>
                )}

                {showPreviousTickets && (
                  <div
                    title={`تیکت‌های قبلی: ${faNum(therapy?.previousTicketsCount ?? 0)}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>🎫</span>
                    <span>{faNum(therapy?.previousTicketsCount ?? 0)}</span>
                  </div>
                )}

                {showSubscription && (
                  <div
                    title={`اشتراک درمان: ${
                      therapy?.subscription?.plan || "free"
                    } | ${
                      therapy?.subscription?.isExpired
                        ? "منقضی شده"
                        : `باقی‌مانده: ${faNum(therapy?.subscription?.daysLeft ?? "—")} روز`
                    }`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>💳</span>
                    <span>{String(therapy?.subscription?.plan || "free").toUpperCase()}</span>
                    <span
                      style={{
                        color: therapy?.subscription?.isExpired ? "#ef4444" : "#94a3b8",
                        fontSize: 11,
                      }}
                    >
                      {therapy?.subscription?.isExpired ? "منقضی" : faNum(therapy?.subscription?.daysLeft ?? "—")}
                    </span>
                  </div>
                )}

                {showTreatmentStart && (
                  <div
                    title={`شروع درمان: ${formatShortDate(
                      therapy?.treatment?.startedAt ?? therapy?.dates?.treatmentStartedAt ?? null
                    )}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>🗓️</span>
                    <span>
                      {formatShortDate(
                        therapy?.treatment?.startedAt ?? therapy?.dates?.treatmentStartedAt ?? null
                      )}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                اطلاعات درمان موجود نیست
              </div>
            )}

            <div
              style={{
                marginTop: 10,
                height: 1,
                background: "linear-gradient(to left, transparent, rgba(148,163,184,0.35), transparent)",
              }}
            />
          </div>

          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, marginBottom: 8 }}>
              <MessagesList
  ticketId={ticket.id}
  messages={ticket.messages}
  userName={userName}
  backendBase={backendMediaBase}
/>
            </div>

            <div style={{ borderTop: "1px solid rgba(148,163,184,0.18)", paddingTop: 8 }}>
              <ReplyBar ticketId={ticket.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
