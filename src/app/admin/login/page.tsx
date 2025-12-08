"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

function mapErrorMessage(code: string): string {
  switch (code) {
    case "login_failed":
    case "invalid_credentials":
      return "ایمیل یا رمز عبور اشتباه است.";
    case "unauthorized":
      return "دسترسی شما به این بخش مجاز نیست.";
    case "internal_error":
      return "اشکال داخلی سرور؛ کمی بعد دوباره امتحان کنید.";
    default:
      // اگر پیام خاصی از بک‌اند آمد، همان را نشان بده
      return code;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/admin/tickets";

  // فقط ایمیل + رمز
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setErr(null);

    const body = { email: email.trim(), password };

    if (!body.email || !body.password) {
      setErr("ایمیل و رمز را کامل وارد کنید.");
      return;
    }

    try {
      setBusy(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!json?.ok) {
        setErr(json?.error || "login_failed");
        return;
      }

      // بعد از لاگین: ریدایرکت به صفحهٔ مورد نظر
      router.replace(redirectTo);
      router.refresh();
    } catch (e) {
      setErr("internal_error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* هدر بالا */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#333] bg-[#0b0b0b]">
        <a
          href="/admin/tickets"
          className="font-bold text-lg hover:text-orange-400"
        >
          🎛️ پنل مدیریت ققنوس
        </a>

        <div className="flex items-center gap-3 text-xs md:text-sm opacity-70">
          <span>ورود مدیر پشتیبانی</span>
        </div>
      </header>

      {/* بدنه: فرم وسط صفحه و محدود شده */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <form
            onSubmit={onSubmit}
            autoComplete="on"
            className="w-full p-6 rounded-2xl border border-[#333] bg-[#0b0b0b] space-y-4 shadow-xl"
          >
            <h1 className="text-2xl font-extrabold text-center mb-1">
              ورود مدیر پشتیبانی
            </h1>
            <p className="text-xs text-center text-gray-400 mb-2">
              برای دسترسی به تیکت‌ها و مدیریت کاربران وارد شوید.
            </p>

            <div className="space-y-2">
              <label className="block text-sm opacity-80 text-right">
                ایمیل
              </label>
              <input
                className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none text-sm"
                placeholder="email@example.com"
                type="email"
                name="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm opacity-80 text-right">
                رمز عبور
              </label>
              <input
                className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none text-sm"
                placeholder="••••••••"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                autoComplete="current-password"
              />
            </div>

            {err && (
              <div className="text-red-400 text-xs md:text-sm text-center">
                {mapErrorMessage(err)}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-bold transition-colors"
            >
              {busy ? "در حال ورود…" : "ورود"}
            </button>

            <p className="text-[11px] text-center text-gray-500 mt-2 leading-relaxed">
              این پنل فقط برای تیم پشتیبانی ققنوس است. در صورت نیاز به دسترسی
              جدید، با مدیر ارشد تماس بگیرید.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}