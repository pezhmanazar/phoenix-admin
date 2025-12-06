"use client";

import React from "react";
import { useRouter } from "next/navigation";

type S = "open" | "pending" | "closed";

export default function StatusChanger({ id, current }: { id: string; current: S }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const setStatus = async (status: S) => {
    if (status === current) return;
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

  const Item = ({ v, label }: { v: S; label: string }) => (
    <button
      onClick={() => setStatus(v)}
      className={`px-3 py-1 rounded-lg border ${
        current === v ? "bg-green-600 border-green-600" : "bg-[#111] border-[#333]"
      }`}
      disabled={busy}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-8 items-center">
      <span className="opacity-80">وضعیت:</span>
      <Item v="open" label="باز" />
      <Item v="pending" label="در انتظار" />
      <Item v="closed" label="بسته" />
    </div>
  );
}