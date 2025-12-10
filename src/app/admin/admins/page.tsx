// src/app/admin/admins/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResetPasswordButton from "./ResetPasswordButton.client";

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
      setErr(null);
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
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            padding: "24px 24px 20px",
            borderRadius: "18px",
            border: "1px solid #333",
            backgroundColor: "#0b0b0b",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            boxSizing: "border-box",
          }}
        >
          {/* هدر + دکمه افزودن */}
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                مدیریت ادمین‌ها
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                در این بخش می‌توانی اعضای تیم پشتیبانی را ببینی، نقش‌شان را
                عوض کنی و در صورت نیاز حذف کنی.
              </p>
            </div>
            <Link
              href="/admin/admins/new"
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                backgroundColor: "#059669",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              + افزودن ادمین جدید
            </Link>
          </div>

          {/* وضعیت لود / خطا / لیست */}
          {loading ? (
            <div
              style={{
                padding: "12px",
                fontSize: "13px",
              }}
            >
              ⏳ در حال بارگذاری...
            </div>
          ) : err ? (
            <div
              style={{
                padding: "12px",
                fontSize: "13px",
                color: "#f87171",
              }}
            >
              خطا: {err}
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px dashed #333",
                backgroundColor: "#020617",
                fontSize: "13px",
                textAlign: "center",
                color: "#e5e7eb",
              }}
            >
              ادمینی ثبت نشده است.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                borderRadius: "12px",
                border: "1px solid #222",
                backgroundColor: "#020617",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#111827",
                      color: "#9ca3af",
                    }}
                  >
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      ایمیل
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      نام
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      نقش
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      اقدامات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => {
                    const isOwner = a.role === "owner";
                    return (
                      <tr
                        key={a.id}
                        style={{
                          backgroundColor: "#020617",
                        }}
                      >
                        <td
                          style={{
                            padding: "8px",
                            borderTop: "1px solid #111827",
                            wordBreak: "break-all",
                            direction: "ltr",
                            textAlign: "left",
                            fontSize: "12px",
                          }}
                        >
                          {a.email}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            borderTop: "1px solid #111827",
                          }}
                        >
                          {a.name || "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            borderTop: "1px solid #111827",
                          }}
                        >
                          <select
                            value={a.role}
                            disabled={isOwner}
                            onChange={(e) =>
                              onChangeRole(a.id, e.target.value as Admin["role"])
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "999px",
                              border: "1px solid #374151",
                              backgroundColor: isOwner ? "#111827" : "#000",
                              color: "#e5e7eb",
                              fontSize: "12px",
                              cursor: isOwner ? "not-allowed" : "pointer",
                              outline: "none",
                            }}
                          >
                            <option value="owner">owner</option>
                            <option value="manager">manager</option>
                            <option value="agent">agent</option>
                          </select>
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            borderTop: "1px solid #111827",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* دکمه ریست پسورد */}
                            <ResetPasswordButton adminId={a.id} />
                            <button
                              onClick={() => onDelete(a.id)}
                              disabled={isOwner}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: isOwner
                                  ? "#4b5563"
                                  : "#dc2626",
                                color: "#fff",
                                fontSize: "12px",
                                cursor: isOwner ? "not-allowed" : "pointer",
                                opacity: isOwner ? 0.6 : 1,
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}