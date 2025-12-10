// src/app/admin/profile/page.tsx
"use client";

import { useState, FormEvent } from "react";

export default function AdminProfilePage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

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
            ویرایش پروفایل ادمین
          </h1>

          <p
            style={{
              fontSize: "12px",
              textAlign: "center",
              color: "#9ca3af",
              marginBottom: "18px",
            }}
          >
            می‌توانی نام نمایش و رمز عبور ورود به پنل ادمین را از اینجا تغییر بدهی.
          </p>

          {/* نام جدید */}
          <div style={{ marginBottom: "12px", textAlign: "right" }}>
            <label
              htmlFor="admin-name"
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "6px",
                opacity: 0.85,
              }}
            >
              نام جدید (اختیاری)
            </label>
            <input
              id="admin-name"
              type="text"
              placeholder="نام نمایشی جدید…"
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

          {/* رمز جدید */}
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
              رمز جدید (اختیاری)
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
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
            <p
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginTop: "6px",
                lineHeight: 1.6,
              }}
            >
              اگر هر کدام از این فیلدها را خالی بگذاری، همان مقدار قبلی حفظ می‌شود.
            </p>
          </div>

          {/* پیام وضعیت */}
          {msg && (
            <div
              style={{
                fontSize: "12px",
                textAlign: "center",
                marginBottom: "10px",
                color: msg.startsWith("✔") ? "#4ade80" : "#f87171",
              }}
            >
              {msg}
            </div>
          )}

          {/* دکمه ذخیره */}
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
            {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </form>
      </main>
    </div>
  );
}