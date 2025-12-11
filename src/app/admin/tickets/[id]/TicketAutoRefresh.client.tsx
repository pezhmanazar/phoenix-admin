// src/app/admin/tickets/[id]/TicketAutoRefresh.client.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TicketAutoRefresh({
  intervalMs = 10000, // هر ۱۰ ثانیه یک بار
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null; // چیزی رندر نمی‌کنه
}