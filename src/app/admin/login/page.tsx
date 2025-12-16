// src/app/admin/login/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

function mapErrorMessage(code: string): string {
  switch (code) {
    case "login_failed":
    case "invalid_credentials":
      return "ایمیل یا رمز عبور اشتباه است.";
    case "missing_login_fields":
      return "ایمیل و رمز رو کامل وارد کنید.";
    case "unauthorized":
      return "دسترسی شما به این بخش مجاز نیست.";
    case "internal_error":
      return "اشکال داخلی سرور؛ کمی بعد دوباره امتحان کنید.";
    case "failed_to_fetch":
      return "ارتباط با سرور برقرار نشد. اینترنت/SSL/سرور را چک کنید.";
    default:
      return code;
  }
}

type LoginOk = {
  ok: true;
  admin: any;
  redirect?: boolean;
};

type LoginFail = {
  ok: false;
  error: string;
};

type LoginResponse = LoginOk | LoginFail;

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/admin/tickets";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setErr(null);

    const body = { email: email.trim().toLowerCase(), password: password.trim() };
    if (!body.email || !body.password) {
      setErr("missing_login_fields");
      return;
    }

    try {
      setBusy(true);

      // ✅ مهم: لاگین باید از /api/auth/login روی خود Next انجام شود تا cookie ست شود
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // ✅ اگر به جای JSON، HTML برگشت (مثل صفحه خطا/ریدایرکت)، کرش نکن
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.log("[admin login] non-json response:", text.slice(0, 400));
        setErr(`bad_response_${res.status}`);
        return;
      }

      const json = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!json || json.ok !== true) {
        setErr((json as LoginFail | null)?.error || "login_failed");
        return;
      }

      const to = redirectTo || "/admin/tickets";

      // اول روتر
      try {
        router.replace(to);
        router.refresh();
      } catch {
        // ignore
      }

      // بعدش فول ریلود تا کوکی/سشن حتما اعمال شود
      if (typeof window !== "undefined") {
        window.location.href = to;
      }
    } catch (e: any) {
  const msg = String(e?.message || "");
  if (msg.toLowerCase().includes("failed to fetch")) {
    setErr("failed_to_fetch");
  } else {
    setErr(msg || "internal_error");
  }
} finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
        }}
      >
        <form
          onSubmit={onSubmit}
          autoComplete="on"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "24px 24px 20px",
            borderRadius: "18px",
            border: "1px solid #333",
            backgroundColor: "#0b0b0b",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            ورود مدیر پشتیبانی
          </h1>

          <p
            style={{
              fontSize: "12px",
              textAlign: "center",
              color: "#9ca3af",
              marginBottom: "18px",
            }}
          >
            برای دسترسی به تیکت‌ها و مدیریت کاربران وارد شوید.
          </p>

          {/* ایمیل */}
          <div style={{ marginBottom: "12px", textAlign: "right" }}>
            <label
              htmlFor="admin-email"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              ایمیل
            </label>

            <input
              id="admin-email"
              type="email"
              name="username"
              placeholder="email@example.com"
              inputMode="email"
              dir="ltr"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#000",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* پسورد */}
          <div style={{ marginBottom: "12px", textAlign: "right" }}>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              رمز عبور
            </label>

            <input
              id="admin-password"
              type="password"
              name="password"
              placeholder="••••••••"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#000",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* خطا */}
          {err && (
            <div
              style={{
                color: "#f87171",
                fontSize: "12px",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {mapErrorMessage(err)}
            </div>
          )}

          {/* دکمه */}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "9px",
              border: "none",
              backgroundColor: busy ? "#9a3412" : "#ea580c",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
              transition: "background-color 0.15s ease",
              marginTop: "4px",
            }}
          >
            {busy ? "در حال ورود…" : "ورود"}
          </button>

          <p
            style={{
              fontSize: "11px",
              textAlign: "center",
              color: "#6b7280",
              marginTop: "12px",
              lineHeight: 1.7,
              maxWidth: "360px",
              marginInline: "auto",
            }}
          >
            این پنل فقط برای تیم پشتیبانی ققنوس است.
            <br />
            در صورت نیاز به دسترسی جدید، با مدیر ارشد تماس بگیرید.
          </p>
        </form>
      </main>
    </div>
  );
}