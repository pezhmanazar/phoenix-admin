// src/app/admin/admins/ResetPasswordButton.client.tsx
"use client";

import { useState } from "react";

export default function ResetPasswordButton({ adminId }: { adminId: string }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!pwd || pwd.length < 6) {
      setMsg("رمز حداقل ۶ کاراکتر باشد.");
      return;
    }

    try {
      setBusy(true);
      const r = await fetch(`/api/admin/admins/${adminId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        setMsg(j?.error || "internal_error");
        return;
      }

      setMsg("✅ رمز با موفقیت تغییر کرد. (همهٔ سشن‌های قبلی باطل شدند)");
      setPwd("");

      // بعد از کمی تاخیر مودال بسته شود
      setTimeout(() => {
        setOpen(false);
        setMsg(null);
      }, 1000);
    } catch {
      setMsg("internal_error");
    } finally {
      setBusy(false);
    }
  }

  const isSuccess = msg?.startsWith("✅");

  return (
    <>
      {/* دکمه باز کردن مودال - استایل ساده ولی ثابت */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMsg(null);
          setPwd("");
        }}
        style={{
          padding: "6px 12px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#7e22ce",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        ریست رمز
      </button>

      {!open ? null : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <form
            onSubmit={submit}
            autoComplete="off"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "20px 20px 16px",
              borderRadius: "18px",
              border: "1px solid #333",
              backgroundColor: "#0b0b0b",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              boxSizing: "border-box",
              color: "#fff",
            }}
          >
            {/* هدر مودال */}
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 800,
                textAlign: "center",
                marginBottom: "6px",
              }}
            >
              ریست رمز ادمین
            </h2>
            <p
              style={{
                fontSize: "12px",
                textAlign: "center",
                color: "#9ca3af",
                marginBottom: "14px",
                lineHeight: 1.6,
              }}
            >
              رمز جدید را وارد کن. بعد از ذخیره، تمام سشن‌های فعال این ادمین
              باطل می‌شود و باید دوباره وارد شود.
            </p>

            {/* فیلد رمز جدید */}
            <div style={{ marginBottom: "10px", textAlign: "right" }}>
              <label
                htmlFor="admin-reset-password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  marginBottom: "6px",
                  opacity: 0.85,
                }}
              >
                رمز جدید
              </label>
              <input
                id="admin-reset-password"
                type="password"
                placeholder="••••••••"
                dir="ltr"
                autoComplete="new-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
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

            {/* پیام خطا / موفقیت */}
            {msg && (
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "12px",
                  textAlign: "center",
                  color: isSuccess ? "#4ade80" : "#f87171",
                }}
              >
                {msg}
              </div>
            )}

            {/* دکمه‌ها */}
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (busy) return;
                  setOpen(false);
                  setMsg(null);
                  setPwd("");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "9px",
                  border: "1px solid #374151",
                  backgroundColor: "#111827",
                  color: "#e5e7eb",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: "8px 12px",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: busy ? "#9a3412" : "#ea580c",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  transition: "background-color 0.15s ease",
                }}
              >
                {busy ? "در حال ذخیره…" : "ذخیره"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}