// src/app/admin/tickets/[id]/TicketFlags.client.tsx
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

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const baseBtn: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    fontSize: 12,
    cursor: "pointer",
    backgroundColor: "#111",
    borderColor: "#333",
    color: "#fff",
    opacity: busy ? 0.7 : 1,
  };

  const pinnedStyle: React.CSSProperties = pinned
    ? {
        backgroundColor: "#ea580c",
        borderColor: "#ea580c",
        color: "#fff",
      }
    : {};

  const dangerBtn: React.CSSProperties = {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
    color: "#fff",
  };

  return (
    <div style={wrapStyle}>
      <button
        onClick={togglePinned}
        disabled={busy !== null}
        title={pinned ? "برداشتن سنجاق" : "سنجاق‌کردن"}
        style={{
          ...baseBtn,
          ...pinnedStyle,
          opacity: busy !== null ? 0.5 : baseBtn.opacity,
        }}
      >
        ★ {pinned ? "سنجاق‌شده" : "سنجاق کن"}
      </button>

      {unread && (
        <button
          onClick={markRead}
          disabled={busy !== null}
          title="علامت به‌عنوان خوانده‌شده"
          style={{
            ...baseBtn,
            ...dangerBtn,
            opacity: busy !== null ? 0.5 : baseBtn.opacity,
          }}
        >
          علامت خوانده‌شده
        </button>
      )}
    </div>
  );
}