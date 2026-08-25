"use client";

import React, { useEffect, useState } from "react";

type CampaignType =
  | "therapeutic"
  | "sales"
  | "system"
  | "motivational";

type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed";

type NotificationCampaign = {
  id: string;
  title: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  targetRule: unknown;
  createdAt: string;
  updatedAt: string;

  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;

  _count: {
    notifications: number;
  };
};

type CampaignListResponse = {
  ok: true;
  data: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    items: NotificationCampaign[];
  };
};

async function api<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const text = await res.text();

  let json: unknown;

try {
  json = JSON.parse(text);
} catch {
  throw new Error(
    `Non-JSON response (${res.status}): ${text.slice(0, 160)}`
  );
}

if (
  typeof json !== "object" ||
  json === null
) {
  throw new Error(`Invalid JSON response (${res.status})`);
}

const parsed = json as {
  ok?: boolean;
  error?: string;
};

if (!res.ok || parsed.ok === false) {
  throw new Error(parsed.error || `HTTP_${res.status}`);
}

return json as T;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type: CampaignType) {
  if (type === "therapeutic") return "درمانی";
  if (type === "sales") return "فروش";
  if (type === "system") return "سیستمی";
  if (type === "motivational") return "انگیزشی";

  return type;
}

function statusLabel(status: CampaignStatus) {
  if (status === "draft") return "پیش‌نویس";
  if (status === "scheduled") return "زمان‌بندی‌شده";
  if (status === "sending") return "در حال ارسال";
  if (status === "completed") return "ارسال‌شده";
  if (status === "failed") return "ناموفق";

  return status;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationCampaign[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await api<CampaignListResponse>(
        "/admin/api/notification-campaigns?page=1&limit=50"
      );

      setItems(result.data.items || []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : String(e)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg,#050a12,#020617)",
          border: "1px solid #111827",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              نوتیفیکیشن‌ها
            </h1>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              مدیریت کمپین‌های Push Notification ققنوس
            </div>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid #374151",
              background: "#111827",
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading ? "در حال بارگذاری..." : "بروزرسانی"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #7f1d1d",
              background: "#2a0b10",
              color: "#fecaca",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            خطا: {error}
          </div>
        ) : null}

        <div
          style={{
            overflowX: "auto",
            borderRadius: 14,
            border: "1px solid #111827",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {[
                  "عنوان",
                  "نوع",
                  "وضعیت",
                  "تعداد نوتیفیکیشن",
                  "سازنده",
                  "زمان‌بندی",
                  "ارسال",
                  "ایجاد",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid #111827",
                      background: "#050a12",
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 900 }}>
                      {item.title}
                    </div>

                    {item.description ? (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          opacity: 0.65,
                        }}
                      >
                        {item.description}
                      </div>
                    ) : null}
                  </td>

                  <td style={tdStyle}>
                    {typeLabel(item.type)}
                  </td>

                  <td style={tdStyle}>
                    {statusLabel(item.status)}
                  </td>

                  <td style={tdStyle}>
                    {item._count?.notifications ?? 0}
                  </td>

                  <td style={tdStyle}>
                    {item.createdBy?.name || "—"}
                  </td>

                  <td style={tdStyle}>
                    {formatDate(item.scheduledAt)}
                  </td>

                  <td style={tdStyle}>
                    {formatDate(item.sentAt)}
                  </td>

                  <td style={tdStyle}>
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      padding: 30,
                      opacity: 0.6,
                    }}
                  >
                    هنوز کمپینی ساخته نشده.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "middle",
};