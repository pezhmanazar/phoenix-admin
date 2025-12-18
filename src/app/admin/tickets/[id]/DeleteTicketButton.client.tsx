// src/app/admin/tickets/[id]/DeleteTicketButton.client.tsx
"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function DeleteTicketButton({ ticketId }: { ticketId: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("حذف کامل تیکت؟ پیام‌ها هم پاک می‌شوند و برگشت ندارد.")) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/admin/tickets/${ticketId}`, {
            method: "DELETE",
            headers: { Accept: "application/json" },
            credentials: "include",
          });

          const j = await res.json().catch(() => null);
          if (!res.ok || !j?.ok) throw new Error(j?.error || "delete_failed");

          // ✅ برگرد به لیست و داده‌ها را تازه کن
          r.replace("/admin/tickets");
          r.refresh();
        } catch (e: any) {
          alert(String(e?.message || "delete_failed"));
        } finally {
          setBusy(false);
        }
      }}
      style={{
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid #7f1d1d",
        backgroundColor: "#450a0a",
        color: "#fecaca",
        fontSize: 12,
        fontWeight: 900,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      حذف تیکت
    </button>
  );
}