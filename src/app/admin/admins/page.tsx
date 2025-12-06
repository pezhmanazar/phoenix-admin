// src/app/admin/admins/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ResetPasswordButton from "./ResetPasswordButton.client"; // ✅ اضافه شد

type Admin = {
  id: string;
  email: string;
  name?: string | null;
  role: "owner" | "manager" | "agent";
  apiKey?: string | null;
  createdAt?: string;
};

export default function AdminsPage() {
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/admin/admins", { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "load_failed");
      setItems(j.admins || []);
    } catch (e: any) {
      setErr(e?.message || "internal_error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("این ادمین حذف شود؟")) return;
    const r = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!j?.ok) {
      alert(j?.error || "delete_failed");
      return;
    }
    await load();
  }

  async function onChangeRole(id: string, role: Admin["role"]) {
    const r = await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const j = await r.json();
    if (!j?.ok) {
      alert(j?.error || "update_failed");
      return;
    }
    await load();
  }

  return (
    <div className="text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت ادمین‌ها</h1>
        <Link
          href="/admin/admins/new"
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
        >
          افزودن ادمین جدید
        </Link>
      </div>

      {loading ? (
        <div className="p-4">⏳ در حال بارگذاری...</div>
      ) : err ? (
        <div className="p-4 text-red-400">خطا: {err}</div>
      ) : items.length === 0 ? (
        <div className="p-4 border border-[#333] rounded-xl bg-[#0b0b0b]">
          ادمینی ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse border border-[#333]">
            <thead>
              <tr className="bg-[#111]">
                <th className="border border-[#333] p-2 text-center">ایمیل</th>
                <th className="border border-[#333] p-2 text-center">نام</th>
                <th className="border border-[#333] p-2 text-center">نقش</th>
                <th className="border border-[#333] p-2 text-center">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-[#151515]">
                  <td className="border border-[#333] p-2 text-center">{a.email}</td>
                  <td className="border border-[#333] p-2 text-center">
                    {a.name || "—"}
                  </td>
                  <td className="border border-[#333] p-2 text-center">
                    <select
                      className="bg-black border border-[#333] rounded px-2 py-1"
                      value={a.role}
                      onChange={(e) =>
                        onChangeRole(a.id, e.target.value as Admin["role"])
                      }
                      disabled={a.role === "owner"} // مالک را قفل می‌گذاریم
                    >
                      <option value="owner">owner</option>
                      <option value="manager">manager</option>
                      <option value="agent">agent</option>
                    </select>
                  </td>
                  <td className="border border-[#333] p-2 text-center flex items-center justify-center gap-2">
                    {/* ✅ دکمه ریست پسورد */}
                    <ResetPasswordButton adminId={a.id} />

                    <button
                      onClick={() => onDelete(a.id)}
                      disabled={a.role === "owner"} // مالک حذف نشود
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}