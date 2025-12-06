"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/admin/tickets";

  // فقط ایمیل+رمز
  const [email, setEmail] = useState(""); // بدون مقدار پیش‌فرض
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const body = { email: email.trim(), password };
    if (!body.email || !body.password) return setErr("ایمیل و رمز را کامل وارد کنید.");

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

      // اختیاری: ذخیره‌ی کرِدِنشیال در مرورگرهای پشتیبان
      try {
        if (typeof window !== "undefined" && "PasswordCredential" in window) {
          // @ts-ignore
          const cred = new window.PasswordCredential({
            id: body.email,              // username
            password: body.password,     // password
            name: json?.admin?.name || body.email,
          });
          // @ts-ignore
          await navigator.credentials.store(cred);
        }
      } catch {}

      // بعد از لاگین: ریدایرکت + رفرش تا layout نقش را از سرور بخواند
      router.replace(redirectTo);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "internal_error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-black text-white p-6">
      <form
        onSubmit={onSubmit}
        autoComplete="on" // ← اجازه به مرورگر برای ذخیره/پیشنهاد
        className="w-full max-w-md p-6 rounded-2xl border border-[#333] bg-[#0b0b0b] space-y-4"
      >
        <h1 className="text-2xl font-extrabold text-center">ورود مدیر پشتیبانی</h1>

        <input
          className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none"
          placeholder="email@example.com"
          type="email"
          name="username"            // مهم برای مدیرهای رمز
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
          autoComplete="username"
          autoFocus
        />

        <input
          className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none"
          placeholder="••••••••"
          type="password"
          name="password"            // مهم برای مدیرهای رمز
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
          autoComplete="current-password"
        />

        {err ? <div className="text-red-400 text-sm">{String(err)}</div> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 rounded-lg bg-orange-600 disabled:opacity-60"
        >
          {busy ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </div>
  );
}