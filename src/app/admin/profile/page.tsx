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
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_top,_#111827,_#020617)]">
      {/* کارت فرم */}
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-[#0b0b0b]/95 backdrop-blur-xl border border-[#222] rounded-2xl p-6 md:p-7 shadow-[0_18px_45px_rgba(0,0,0,0.7)] space-y-5"
      >
        {/* عنوان */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">ویرایش پروفایل</h1>
          <p className="text-sm text-white/60">
            می‌توانی نام یا رمز جدید برای حساب ادمین تنظیم کنی.
          </p>
        </div>

        {/* فیلد نام */}
        <div className="flex flex-col gap-1">
          <label className="text-sm opacity-80">نام جدید (اختیاری)</label>
          <input
            className="w-full bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            placeholder="نام جدید…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* فیلد رمز */}
        <div className="flex flex-col gap-1">
          <label className="text-sm opacity-80">رمز جدید (اختیاری)</label>
          <input
            type="password"
            className="w-full bg-black/80 border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            placeholder="رمز جدید…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* پیام خطا یا موفقیت */}
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

        {/* دکمه */}
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-sm font-semibold"
        >
          {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </form>
    </div>
  );
}