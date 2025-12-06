// src/app/admin/tickets/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReplyBar from "./ReplyBar.client";
import TicketFlags from "./TicketFlags.client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
// آیکن‌ها
import {
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
// پلیر ویس کلاینتی
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

  if (res.status === 401) redirect(`/admin/login?redirect=/admin/tickets/${id}`);
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
  the_token: {
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
      },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
    revalidatePath(`/admin/tickets/${id}`);
  }
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

  const backendBase = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:4000";
  const userName = ticket.openedByName || ticket.title || "کاربر";

  // آیکن وضعیت بر اساس حالت
  const statusIcon =
    ticket.status === "open" ? (
      <CheckCircleIcon className="w-6 h-6 text-green-400" />
    ) : ticket.status === "pending" ? (
      <ClockIcon className="w-6 h-6 text-yellow-400" />
    ) : (
      <LockClosedIcon className="w-6 h-6 text-gray-400" />
    );

  return (
    <div className="max-w-3xl mx-auto text-white">
      {/* هدر چسبنده */}
      <div className="sticky top-0 z-40 backdrop-blur bg-black/70 border-b border-[#222]">
        {/* ردیف بالا: فلش بازگشت */}
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            href="/admin/tickets"
            className="opacity-80 hover:opacity-100 text-3xl rotate-180 select-none"
            aria-label="بازگشت"
            title="بازگشت"
          >
            <ArrowLeftIcon className="w-7 h-7 text-white/80" />
          </Link>
          <div className="flex-1" />
        </div>

        {/* ردیف دوم (swap شده): چپ = نام+ستاره | راست = نوع+وضعیت */}
        <div className="px-6 pb-3 flex items-center justify-between">
          {/* چپ: نام کاربر و ستاره سنجاق */}
          <div className="text-xl font-extrabold flex items-center gap-2">
            {userName}
            <form action={togglePinAction}>
              <input type="hidden" name="id" value={ticket.id} />
              <input type="hidden" name="to" value={(!ticket.pinned).toString()} />
              <button
                type="submit"
                className="opacity-80 hover:opacity-100"
                title={ticket.pinned ? "برداشتن سنجاق" : "سنجاق‌کردن تیکت"}
              >
                {ticket.pinned ? (
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                ) : (
                  <StarOutline className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </form>
          </div>

          {/* راست: نوع تیکت و بج وضعیت (آیکن قابل کلیک) */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                ticket.type === "tech"
                  ? "bg-blue-600/20 text-blue-400 border-blue-700/50"
                  : "bg-purple-600/20 text-purple-300 border-purple-700/50"
              }`}
            >
              {ticket.type === "tech" ? "پشتیبانی فنی" : "ارتباط با درمانگر"}
            </span>
            <form action={cycleStatusAction}>
              <input type="hidden" name="id" value={ticket.id} />
              <input type="hidden" name="current" value={ticket.status} />
              <button
                type="submit"
                className="opacity-90 hover:opacity-100 transition-all"
                title={
                  ticket.status === "open"
                    ? "باز (کلیک برای در انتظار)"
                    : ticket.status === "pending"
                    ? "در انتظار (کلیک برای بسته)"
                    : "بسته (کلیک برای باز)"
                }
              >
                {statusIcon}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* بدنه گفتگو */}
      <div className="p-6">
        {ticket.messages?.length ? (
          <div className="flex flex-col gap-3">
            {ticket.messages.map((m) => {
              const mine = m.sender === "admin";
              const when = m.createdAt || m.ts;
              const type = m.type || "text";
              const rel = (m.fileUrl || "").toString();
              const hasFile = rel && rel.startsWith("/");
              const fullUrl = hasFile ? `${backendBase}${rel}` : null;
              const senderLabel = mine ? "پشتیبانی ققنوس" : userName;

              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] p-3 rounded-xl border ${
                    mine ? "self-start bg-orange-600 border-orange-600" : "self-end bg-black border-[#333]"
                  }`}
                >
                  <div className={`text-xs mb-1 ${mine ? "text-white/80" : "text-white/60"}`}>
                    {senderLabel}
                    {when ? <span className="mx-2 opacity-60">• {new Date(when).toLocaleString("fa-IR")}</span> : null}
                  </div>

                  {m.text ? <div className="text-white whitespace-pre-wrap mb-2">{m.text}</div> : null}

                  {type === "image" && fullUrl ? (
                    <img src={fullUrl} alt="image" className="max-h-80 rounded-lg border border-[#333]" />
                  ) : type === "voice" && fullUrl ? (
                    <VoicePlayer src={fullUrl} />
                  ) : type === "file" && fullUrl ? (
                    <a href={fullUrl} target="_blank" className="underline text-white/90">
                      دانلود فایل
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="opacity-60">هنوز پیامی ثبت نشده.</div>
        )}

        {/* نوار پاسخ */}
        <ReplyBar />
      </div>
    </div>
  );
}