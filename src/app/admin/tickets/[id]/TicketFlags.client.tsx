"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function TicketFlags({
  id,
  pinned,
  unread,
}: {
  id: string;
  pinned: boolean;
  unread: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | "pin" | "read">(null);

  const togglePinned = async () => {
    if (busy) return;
    setBusy("pin");
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
      const json = await res.json();
      if (!json?.ok) alert(json?.error || "خطا در بروزرسانی سنجاق");
      else router.refresh();
    } catch (e: any) {
      alert(e?.message || "خطا در ارتباط با سرور");
    } finally {
      setBusy(null);
    }
  };

  const markRead = async () => {
    if (busy) return;
    setBusy("read");
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: false }),
      });
      const json = await res.json();
      if (!json?.ok) alert(json?.error || "خطا در بروزرسانی خوانده‌شدن");
      else router.refresh();
    } catch (e: any) {
      alert(e?.message || "خطا در ارتباط با سرور");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePinned}
        disabled={busy !== null}
        className={`px-3 py-1 rounded-lg border ${
          pinned
            ? "bg-orange-600 text-white border-orange-600"
            : "bg-[#111] border-[#333] text-white"
        } disabled:opacity-60`}
        title={pinned ? "برداشتن سنجاق" : "سنجاق‌کردن"}
      >
        ★ {pinned ? "سنجاق‌شده" : "سنجاق کن"}
      </button>

      {unread && (
        <button
          onClick={markRead}
          disabled={busy !== null}
          className="px-3 py-1 rounded-lg border bg-red-600 text-white border-red-600 disabled:opacity-60"
          title="علامت به‌عنوان خوانده‌شده"
        >
          علامت خوانده‌شده
        </button>
      )}
    </div>
  );
}