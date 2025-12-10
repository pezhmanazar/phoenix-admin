// src/app/admin/tickets/[id]/StatusChanger.client.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";

type S = "open" | "pending" | "closed";

export default function StatusChanger({
  id,
  current,
}: {
  id: string;
  current: S;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const setStatus = async (status: S) => {
    if (status === current || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json?.ok) alert(json?.error || "بروزرسانی وضعیت ناموفق بود");
      else router.refresh();
    } catch (e: any) {
      alert(e?.message || "خطا در تغییر وضعیت");
    } finally {
      setBusy(false);
    }
  };

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
  };

  const labelStyle: React.CSSProperties = {
    opacity: 0.8,
    fontSize: 13,
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
  };

  const selectedStyle: React.CSSProperties = {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  };

  const Item = ({ v, label }: { v: S; label: string }) => (
    <button
      onClick={() => setStatus(v)}
      disabled={busy}
      style={{
        ...baseBtn,
        ...(current === v ? selectedStyle : {}),
        opacity: busy ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={wrapStyle}>
      <span style={labelStyle}>وضعیت:</span>
      <Item v="open" label="باز" />
      <Item v="pending" label="در انتظار" />
      <Item v="closed" label="بسته" />
    </div>
  );
}