// src/app/admin/profile/page.tsx
"use client";

import { useState } from "react";

export default function AdminProfilePage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      setBusy(true);

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          password: password || undefined,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setMsg(json.error || "خطا در ذخیره تغییرات");
      } else {
        setMsg("✔ تغییرات با موفقیت ذخیره شد.");
        setName("");
        setPassword("");
      }
    } catch {
      setMsg("خطای داخلی سرور، دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    // 🔹 شِل مثل صفحه تیکت‌ها: فقط کانتینر وسط، بدون min-h-screen جدا
    <div className="w-full max-w-3xl mx-auto py-6 px-4 md:px-6 text-white space-y-4">
      {/* هدر صفحه مثل تیکت‌ها */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">ویرایش پروفایل</h1>
        <p className="text-sm text-white/60">
          می‌توانی نام نمایش و رمز عبور پنل ادمین را از اینجا تغییر بدهی.
        </p>
      </div>

      {/* کارت فرم، شبیه کارت فیلتر/لیست تیکت‌ها */}
      <div className="rounded-2xl border border-[#222] bg-[#050505]/95 backdrop-blur-md p-4 md:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.7)] space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm opacity-80">نام جدید (اختیاری)</label>
            <input
              className="w-full bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              placeholder="نام جدید…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm opacity-80">رمز جدید (اختیاری)</label>
            <input
              type="password"
              className="w-full bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              placeholder="رمز جدید…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[11px] text-white/40 mt-1">
              اگر فیلدی را خالی بگذاری، همان مورد بدون تغییر می‌ماند.
            </p>
          </div>

          {msg && (
            <div
              className={`text-sm text-center px-3 py-2 rounded-lg ${
                msg.includes("✔")
                  ? "bg-green-900/30 text-green-300 border border-green-700/40"
                  : "bg-red-900/30 text-red-300 border border-red-700/40"
              }`}
            >
              {msg}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-sm font-semibold"
            >
              {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}