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
  pushTitle: string;
  pushBody: string;
  notificationType: string;
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

  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
  title: "",
  description: "",
  pushTitle: "",
  pushBody: "",
  type: "therapeutic" as CampaignType,
  notificationType: "marketing",
  targetRule: {
    plan: "all",
  },
});
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

    async function createCampaign() {
    try {
      const res = await fetch(
        "/admin/api/notification-campaigns",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(
          json.error || "CREATE_FAILED"
        );
      }

      setCreateOpen(false);

      setForm({
  title: "",
  description: "",
  pushTitle: "",
  pushBody: "",
  type: "therapeutic",
  notificationType: "marketing",
  targetRule: {
    plan: "all",
  },
});

      await load();

    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "خطا در ساخت کمپین"
      );
    }
  }

  async function sendCampaign(id: string) {
  const ok = confirm(
    "آیا مطمئن هستید؟ ارسال کمپین شروع می‌شود."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `/admin/api/notification-campaigns/${id}/send`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const json = await res.json();

    if (!res.ok || json.ok === false) {
      throw new Error(
        json.error || "SEND_FAILED"
      );
    }

    alert(
      `ارسال انجام شد. موفق: ${json.result.sent} - خطا: ${json.result.failed}`
    );

    await load();

  } catch (e) {
    alert(
      e instanceof Error
        ? e.message
        : "خطا در ارسال کمپین"
    );
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
  onClick={() => setCreateOpen(true)}
  style={{
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #166534",
    background: "#14532d",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  }}
>
  + کمپین جدید
</button>

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

        {createOpen ? (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >

    <div
      style={{
        width: 420,
        background: "#050a12",
        border: "1px solid #1f2937",
        borderRadius: 18,
        padding: 20,
      }}
    >

      <h2
        style={{
          color:"#fff",
          marginTop:0
        }}
      >
        ساخت کمپین جدید
      </h2>


      <input
        placeholder="عنوان کمپین"
        value={form.title}
        onChange={(e)=>
          setForm({
            ...form,
            title:e.target.value
          })
        }
        style={inputStyle}
      />


      <textarea
        placeholder="توضیحات"
        value={form.description}
        onChange={(e)=>
          setForm({
            ...form,
            description:e.target.value
          })
        }
        style={{
          ...inputStyle,
          minHeight:80
        }}
      />

      <input
  placeholder="عنوان نوتیفیکیشن (Push Title)"
  value={form.pushTitle}
  onChange={(e)=>
    setForm({
      ...form,
      pushTitle:e.target.value
    })
  }
  style={inputStyle}
/>

<textarea
  placeholder="متن نوتیفیکیشن (Push Body)"
  value={form.pushBody}
  onChange={(e)=>
    setForm({
      ...form,
      pushBody:e.target.value
    })
  }
  style={{
    ...inputStyle,
    minHeight:80
  }}
/>


      <select
        value={form.type}
        onChange={(e)=>
          setForm({
            ...form,
            type:e.target.value as CampaignType
          })
        }
        style={inputStyle}
      >
        <option value="therapeutic">
          درمانی
        </option>

        <option value="sales">
          فروش
        </option>

        <option value="system">
          سیستمی
        </option>

        <option value="motivational">
          انگیزشی
        </option>

      </select>


      <select
        value={form.targetRule.plan}
        onChange={(e)=>
          setForm({
            ...form,
            targetRule:{
              plan:e.target.value
            }
          })
        }
        style={inputStyle}
      >

        <option value="all">
          همه کاربران
        </option>

        <option value="free">
          Free
        </option>

        <option value="pro">
          Pro
        </option>

      </select>


      <div
        style={{
          display:"flex",
          gap:10,
          marginTop:15
        }}
      >

        <button
          onClick={createCampaign}
          style={primaryBtn}
        >
          ساخت کمپین
        </button>


        <button
          onClick={()=>setCreateOpen(false)}
          style={secondaryBtn}
        >
          لغو
        </button>

      </div>

    </div>

  </div>
):null}

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
                  "عنوان Push",
                  "متن Push",
                  "نوع",
                  "وضعیت",
                  "تعداد نوتیفیکیشن",
                  "سازنده",
                  "زمان‌بندی",
                  "ارسال",
                  "ایجاد",
                  "عملیات",
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
                   {item.pushTitle || "—"}
                  </td>

                 <td style={tdStyle}>
                 {item.pushBody || "—"}
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

                  <td style={tdStyle}>
  {item.status === "draft" ? (
    <button
      onClick={() => void sendCampaign(item.id)}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid #166534",
        background: "#14532d",
        color: "#dcfce7",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      ارسال
    </button>
  ) : (
    "—"
  )}
</td>
                </tr>
              ))}

              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
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

const inputStyle: React.CSSProperties = {
  width:"100%",
  marginTop:10,
  padding:"10px",
  borderRadius:10,
  border:"1px solid #374151",
  background:"#111827",
  color:"#fff",
};


const primaryBtn: React.CSSProperties = {
  padding:"10px 14px",
  borderRadius:10,
  border:"none",
  background:"#16a34a",
  color:"#fff",
  fontWeight:900,
  cursor:"pointer",
};


const secondaryBtn: React.CSSProperties = {
  padding:"10px 14px",
  borderRadius:10,
  border:"1px solid #374151",
  background:"#111827",
  color:"#fff",
  fontWeight:900,
  cursor:"pointer",
};

const tdStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "middle",
};