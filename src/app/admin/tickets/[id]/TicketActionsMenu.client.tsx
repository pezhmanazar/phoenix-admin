"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "right",
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.88)",
  cursor: "pointer",
  fontSize: 12,
};

export default function TicketActionsMenu({
  ticketId,
  pinned,
}: {
  ticketId: string;
  pinned: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pin" | "delete" | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const togglePin = async () => {
    try {
      setBusy("pin");
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ pinned: !pinned }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "pin_failed");

      setOpen(false);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "خطا در پین/آنپین");
    } finally {
      setBusy(null);
    }
  };

  const deleteTicket = async () => {
    const ok = confirm("واقعا می‌خوای این تیکت حذف بشه؟ (قابل برگشت نیست)");
    if (!ok) return;

    try {
      setBusy("delete");
      const res = await fetch(`/api/admin/tickets/${ticketId}/delete`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "delete_failed");

      window.location.href = "/admin/tickets";
    } catch (e: any) {
      alert(e?.message || "خطا در حذف تیکت");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        title="گزینه‌ها"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.85)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ⋯
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            minWidth: 170,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10,10,12,0.98)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          <button type="button" onClick={togglePin} disabled={!!busy} style={menuItemStyle}>
            {busy === "pin" ? "..." : pinned ? "برداشتن پین" : "پین کردن تیکت"}
          </button>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          <button
            type="button"
            onClick={deleteTicket}
            disabled={!!busy}
            style={{ ...menuItemStyle, color: "rgba(255,120,120,0.95)" }}
          >
            {busy === "delete" ? "..." : "حذف تیکت"}
          </button>
        </div>
      )}
    </div>
  );
}