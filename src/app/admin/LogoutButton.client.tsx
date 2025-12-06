"use client";
import { useState } from "react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    try {
      setBusy(true);
      await fetch("/api/admin/logout", { method: "POST" });
      // ⬅️ هدایت سخت تا SSG/SSR با کوکی پاک‌شده بیاد
      window.location.href = "/admin/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white disabled:opacity-60"
    >
      {busy ? "در حال خروج…" : "خروج 🚪"}
    </button>
  );
}