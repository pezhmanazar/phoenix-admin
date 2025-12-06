"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNewPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "manager" | "agent">("agent");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !password.trim()) {
      setErr("ایمیل و رمز الزامی است.");
      return;
    }
    try {
      setBusy(true);
      const r = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          role,
          password,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const j = await r.json();
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
    <div className="max-w-lg mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">افزودن ادمین جدید</h1>
      <form onSubmit={onSubmit} className="space-y-3 p-4 rounded-xl border border-[#333] bg-[#0b0b0b]">
        <input
          className="w-full bg-black border border-[#333] rounded px-3 py-2"
          placeholder="email@example.com"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full bg-black border border-[#333] rounded px-3 py-2"
          placeholder="نام (اختیاری)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="w-full bg-black border border-[#333] rounded px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="agent">agent</option>
          <option value="manager">manager</option>
          <option value="owner">owner</option>
        </select>
        <input
          className="w-full bg-black border border-[#333] rounded px-3 py-2"
          placeholder="رمز عبور"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="w-full bg-black border border-[#333] rounded px-3 py-2"
          placeholder="API Key (اختیاری)"
          dir="ltr"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />

        {err ? <div className="text-red-400 text-sm">{err}</div> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-60"
          >
            {busy ? "در حال ذخیره…" : "ذخیره"}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}