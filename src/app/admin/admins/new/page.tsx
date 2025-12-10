// src/app/admin/admins/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function mapErrorMessage(code: string): string {
  switch (code) {
    case "create_failed":
      return "ثبت ادمین جدید با مشکل مواجه شد.";
    case "internal_error":
      return "اشکال داخلی سرور؛ کمی بعد دوباره امتحان کنید.";
    default:
      return code;
  }
}

export default function AdminNewPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "manager" | "agent">("agent");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setErr(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErr("ایمیل و رمز الزامی است.");
      return;
    }

    try {
      setBusy(true);
      const r = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim() || undefined,
          role,
          password: trimmedPassword,
          // ❌ apiKey حذف شد
        }),
      });

      const j = await r.json().catch(() => null);

      if (!j?.ok) {
        setErr(j?.error || "create_failed");
        return;
      }

      router.replace("/admin/admins");
    } catch (e: any) {
      setErr(e?.message || "internal_error");
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
            maxWidth: "480px",
            padding: "24px 24px 20px",
            borderRadius: "18px",
            border: "1px solid #333",
            backgroundColor: "#0b0b0b",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
          }}
        >
          {/* عنوان */}
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            افزودن ادمین جدید
          </h1>
          <p
            style={{
              fontSize: "12px",
              textAlign: "center",
              color: "#9ca3af",
              marginBottom: "18px",
            }}
          >
            ادمین جدید را با نقش و اطلاعات مناسب اضافه کن.
          </p>

          {/* ایمیل */}
          <div style={{ marginBottom: "10px", textAlign: "right" }}>
            <label
              htmlFor="new-admin-email"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              ایمیل (الزامی)
            </label>
            <input
              id="new-admin-email"
              type="email"
              placeholder="email@example.com"
              dir="ltr"
              autoComplete="email"
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

          {/* نام */}
          <div style={{ marginBottom: "10px", textAlign: "right" }}>
            <label
              htmlFor="new-admin-name"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              نام (اختیاری)
            </label>
            <input
              id="new-admin-name"
              type="text"
              placeholder="نام ادمین…"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          {/* نقش */}
          <div style={{ marginBottom: "10px", textAlign: "right" }}>
            <label
              htmlFor="new-admin-role"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              نقش
            </label>
            <select
              id="new-admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
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
            >
              <option value="agent">agent (پاسخ‌گو)</option>
              <option value="manager">manager (مدیر)</option>
              <option value="owner">owner (مالک)</option>
            </select>
          </div>

          {/* رمز عبور */}
          <div style={{ marginBottom: "6px", textAlign: "right" }}>
            <label
              htmlFor="new-admin-password"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              رمز عبور (الزامی)
            </label>
            <input
              id="new-admin-password"
              type="password"
              placeholder="••••••••"
              dir="ltr"
              autoComplete="new-password"
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

          {/* پیام خطا */}
          {err && (
            <div
              style={{
                color: "#f87171",
                fontSize: "12px",
                textAlign: "center",
                marginTop: "6px",
                marginBottom: "6px",
              }}
            >
              {mapErrorMessage(err)}
            </div>
          )}

          {/* دکمه‌ها */}
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "9px",
                border: "1px solid #374151",
                backgroundColor: "#111827",
                color: "#e5e7eb",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "9px",
                border: "none",
                backgroundColor: busy ? "#047857" : "#10b981",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.8 : 1,
                transition: "background-color 0.15s ease",
              }}
            >
              {busy ? "در حال ذخیره…" : "ذخیره ادمین"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}