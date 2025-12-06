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
    if (pwd.length < 6) {
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
      setTimeout(() => setOpen(false), 900);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm"
      >
        ریست رمز
      </button>

      {open ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={submit}
            className="w-full max-w-sm p-5 rounded-2xl border border-[#333] bg-[#0b0b0b] space-y-3"
          >
            <div className="text-lg font-bold mb-2">ریست رمز ادمین</div>
            <input
              type="password"
              className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none"
              placeholder="رمز جدید"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              dir="ltr"
              autoComplete="new-password"
              autoFocus
            />
            {msg ? <div className="text-sm text-red-400">{msg}</div> : null}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg bg-[#222] hover:bg-[#333]"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-orange-600 disabled:opacity-60 text-white"
              >
                {busy ? "در حال ذخیره…" : "ذخیره"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}