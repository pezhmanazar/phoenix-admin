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
        body: JSON.stringify({ name, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "خطا در تغییر اطلاعات");
      } else {
        setMsg("✅ تغییرات ذخیره شد.");
        setName("");
        setPassword("");
      }
    } catch (e: any) {
      setMsg(e.message || "internal_error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-[#0b0b0b] p-6 rounded-xl border border-[#333] space-y-4"
      >
        <h1 className="text-xl font-bold text-center">ویرایش پروفایل</h1>

        <input
          className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none"
          placeholder="نام جدید (اختیاری)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 outline-none"
          type="password"
          placeholder="رمز جدید (اختیاری)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {msg && <div className="text-sm text-red-400">{msg}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 rounded-lg bg-orange-600 disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </form>
    </div>
  );
}