"use client";

import React, { useEffect, useRef, useState } from "react";

export default function TicketActionsMenu({
  ticketId,
  pinned,
  togglePinAction,
  deleteTicketAction,
}: {
  ticketId: string;
  pinned: boolean;
  togglePinAction: (formData: FormData) => Promise<void>;
  deleteTicketAction: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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
          color: "rgba(255,255,255,0.9)",
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
            minWidth: 180,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10,10,12,0.98)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* PIN / UNPIN via Server Action */}
          <form action={togglePinAction}>
            <input type="hidden" name="id" value={ticketId} />
            <input type="hidden" name="to" value={(!pinned).toString()} />
            <button
              type="submit"
              style={menuItemStyle}
              onClick={() => setOpen(false)}
            >
              {pinned ? "برداشتن پین" : "پین کردن تیکت"}
            </button>
          </form>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* DELETE via Server Action */}
          <form
            action={deleteTicketAction}
            onSubmit={(e) => {
              const ok = confirm("واقعا می‌خوای این تیکت حذف بشه؟ (قابل برگشت نیست)");
              if (!ok) e.preventDefault();
              else setOpen(false);
            }}
          >
            <input type="hidden" name="id" value={ticketId} />
            <button
              type="submit"
              style={{ ...menuItemStyle, color: "rgba(255,120,120,0.95)" }}
            >
              حذف تیکت
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

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