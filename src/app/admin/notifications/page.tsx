//\phoenix-admin\src\app\admin\notifications\page.tsx
"use client";

import React, { useEffect, useState } from "react";

type CampaignType = "therapeutic" | "sales" | "system" | "motivational";

type CampaignStatus =
  "draft" | "scheduled" | "sending" | "completed" | "failed";

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
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 160)}`);
  }

  if (typeof json !== "object" || json === null) {
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

function getTargetRule(value: unknown): {
  plan?: string;
  appProvider?: string;
} {
  if (typeof value === "object" && value !== null) {
    return value as {
      plan?: string;
      appProvider?: string;
    };
  }

  return {};
}

function planLabel(value: unknown) {
  const plan = getTargetRule(value).plan || "all";

  if (plan === "all") return "همه";
  if (plan === "free") return "رایگان";
  if (plan === "pro") return "پرو فعال";
  if (plan === "expiring") return "در حال انقضا";
  if (plan === "expired") return "منقضی‌شده";

  return plan;
}

function providerLabel(value: unknown) {
  const provider = getTargetRule(value).appProvider || "all";

  if (provider === "all") return "همه";
  if (provider === "bazaar") return "کافه‌بازار";
  if (provider === "direct") return "مستقیم";

  return provider;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationCampaign[]>([]);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [statsByCampaign, setStatsByCampaign] = useState<
    Record<
      string,
      {
        targetUsers: number;
        attemptedUsers: number;
        successfulUsers: number;
        failedUsers: number;

        readUsers: number;
        openedPushUsers: number;

        successRate: number;
        readRate: number;
        pushOpenRate: number;

        successfulDevices: number;
        failedDevices: number;
      }
    >
  >({});

  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pushTitle: "",
    pushBody: "",
    type: "therapeutic" as CampaignType,
    notificationType: "marketing",
    route: "",
    scheduledAt: "",
    targetRule: {
      plan: "all",
      appProvider: "all",
    },
  });
  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await api<CampaignListResponse>(
        "/admin/api/notification-campaigns?page=1&limit=50",
      );

      setItems(result.data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadTargetPreview() {
    setPreviewLoading(true);

    try {
      const res = await fetch("/admin/api/notification-campaigns/preview", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRule: form.targetRule,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "PREVIEW_FAILED");
      }

      setPreviewCount(typeof json.count === "number" ? json.count : 0);
    } catch (error) {
      console.error("[NOTIFICATION_PREVIEW_FAILED]", error);

      setPreviewCount(null);

      alert(
        error instanceof Error ? error.message : "خطا در محاسبه تعداد مخاطبان",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function createCampaign() {
    try {
      const res = await fetch("/admin/api/notification-campaigns", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          pushTitle: form.pushTitle,
          pushBody: form.pushBody,
          type: form.type,
          notificationType: form.notificationType,
          data: form.route
            ? {
                route: form.route,
              }
            : null,
          scheduledAt: form.scheduledAt,
          targetRule: form.targetRule,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "CREATE_FAILED");
      }

      setCreateOpen(false);

      setForm({
        title: "",
        description: "",
        pushTitle: "",
        pushBody: "",
        type: "therapeutic",
        notificationType: "marketing",
        route: "",
        scheduledAt: "",
        targetRule: {
          plan: "all",
          appProvider: "all",
        },
      });

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در ساخت کمپین");
    }
  }

  async function loadCampaignStats(id: string) {
    try {
      const res = await fetch(`/admin/api/notification-campaigns/${id}/stats`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "STATS_FAILED");
      }

      setStatsByCampaign((prev) => ({
        ...prev,
        [id]: json.stats,
      }));
    } catch (error) {
      console.error("[CAMPAIGN_STATS_FAILED]", error);
    }
  }

  async function sendCampaign(id: string) {
    const testUserId = prompt(
      "برای ارسال تست، User ID را وارد کنید.\nبرای ارسال عمومی خالی بگذارید.",
    );
    console.log("TEST USER ID:", testUserId);

    if (testUserId === null) return;

    const ok = confirm(
      testUserId.trim()
        ? "ارسال تست برای این کاربر انجام شود؟"
        : "آیا مطمئن هستید؟ ارسال کمپین برای کاربران شروع می‌شود.",
    );

    if (!ok) return;

    try {
      const res = await fetch(`/admin/api/notification-campaigns/${id}/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          testUserId.trim()
            ? {
                testUserId: testUserId.trim(),
              }
            : {},
        ),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "SEND_FAILED");
      }

      alert(
        `ارسال انجام شد. موفق: ${json.result.sent} - خطا: ${json.result.failed}`,
      );

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در ارسال کمپین");
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
                  color: "#fff",
                  marginTop: 0,
                }}
              >
                ساخت کمپین جدید
              </h2>

              <input
                placeholder="عنوان کمپین"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <textarea
                placeholder="توضیحات"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: 80,
                }}
              />

              <input
                placeholder="عنوان نوتیفیکیشن (Push Title)"
                value={form.pushTitle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pushTitle: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <textarea
                placeholder="متن نوتیفیکیشن (Push Body)"
                value={form.pushBody}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pushBody: e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: 80,
                }}
              />
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scheduledAt: e.target.value,
                  })
                }
                style={inputStyle}
              />
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                زمان بر اساس ساعت ایران (Asia/Tehran) ثبت می‌شود. در جدول
                به‌صورت شمسی نمایش داده خواهد شد.
              </div>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as CampaignType,
                  })
                }
                style={inputStyle}
              >
                <option value="therapeutic">درمانی</option>

                <option value="sales">فروش</option>

                <option value="system">سیستمی</option>

                <option value="motivational">انگیزشی</option>
              </select>

              <select
                value={form.route}
                onChange={(e) =>
                  setForm({
                    ...form,
                    route: e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">بدون مقصد مشخص</option>

                <option value="/(tabs)/Subscription">صفحه اشتراک</option>

                <option value="/(tabs)/Pelekan">پلکان</option>

                <option value="/(tabs)/Panah">پناه</option>

                <option value="/(tabs)/Panahgah">پناهگاه</option>

                <option value="/(tabs)/Phoenix">ققنوس من</option>
              </select>

              <select
                value={form.targetRule.plan}
                onChange={(e) => {
                  setPreviewCount(null);

                  setForm({
                    ...form,
                    targetRule: {
                      ...form.targetRule,
                      plan: e.target.value,
                    },
                  });
                }}
                style={inputStyle}
              >
                <option value="all">همه وضعیت‌های اشتراک</option>

                <option value="free">رایگان</option>

                <option value="pro">پرو فعال</option>

                <option value="expiring">در حال انقضا (۷ روز آینده)</option>

                <option value="expired">منقضی‌شده</option>
              </select>

              <select
                value={form.targetRule.appProvider}
                onChange={(e) => {
                  setPreviewCount(null);

                  setForm({
                    ...form,
                    targetRule: {
                      ...form.targetRule,
                      appProvider: e.target.value,
                    },
                  });
                }}
                style={inputStyle}
              >
                <option value="all">همه نسخه‌های اپ</option>

                <option value="bazaar">کافه‌بازار</option>

                <option value="direct">نسخه مستقیم / زرین‌پال</option>
              </select>

              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #1f2937",
                  background: "#0b1220",
                  color: "#e5e7eb",
                  fontSize: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => void loadTargetPreview()}
                  disabled={previewLoading}
                  style={{
                    ...secondaryBtn,
                    width: "100%",
                  }}
                >
                  {previewLoading ? "در حال محاسبه..." : "محاسبه تعداد مخاطبان"}
                </button>

                {previewCount !== null ? (
                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                      fontWeight: 900,
                    }}
                  >
                    تعداد کاربران هدف دارای دستگاه فعال: {previewCount}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 15,
                }}
              >
                <button onClick={createCampaign} style={primaryBtn}>
                  ساخت کمپین
                </button>

                <button
                  onClick={() => setCreateOpen(false)}
                  style={secondaryBtn}
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
                  "اشتراک مخاطب",
                  "نسخه اپ",
                  "تعداد نوتیفیکیشن",
                  "آمار ارسال",
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
                    <div style={{ fontWeight: 900 }}>{item.title}</div>

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

                  <td style={tdStyle}>{item.pushTitle || "—"}</td>

                  <td style={tdStyle}>{item.pushBody || "—"}</td>

                  <td style={tdStyle}>{typeLabel(item.type)}</td>

                  <td style={tdStyle}>{statusLabel(item.status)}</td>

                  <td style={tdStyle}>{planLabel(item.targetRule)}</td>

                  <td style={tdStyle}>{providerLabel(item.targetRule)}</td>

                  <td style={tdStyle}>{item._count?.notifications ?? 0}</td>

                  <td style={tdStyle}>
                    {statsByCampaign[item.id] ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>هدف: {statsByCampaign[item.id].targetUsers}</span>

                        <span>
                          ارسال موفق: {statsByCampaign[item.id].successfulUsers}
                        </span>

                        <span>
                          ناموفق: {statsByCampaign[item.id].failedUsers}
                        </span>

                        <span>
                          نرخ موفقیت: {statsByCampaign[item.id].successRate}٪
                        </span>

                        <span
                          style={{
                            marginTop: 4,
                            paddingTop: 4,
                            borderTop: "1px solid rgba(255,255,255,.08)",
                          }}
                        >
                          خوانده‌شده: {statsByCampaign[item.id].readUsers}
                        </span>

                        <span>
                          نرخ خواندن: {statsByCampaign[item.id].readRate}٪
                        </span>

                        <span>
                          بازشده از Push:{" "}
                          {statsByCampaign[item.id].openedPushUsers}
                        </span>

                        <span>
                          نرخ بازشدن Push:{" "}
                          {statsByCampaign[item.id].pushOpenRate}٪
                        </span>
                        <button
                          type="button"
                          onClick={() => void loadCampaignStats(item.id)}
                          style={{
                            ...secondaryBtn,
                            marginTop: 6,
                            padding: "5px 8px",
                            fontSize: 10,
                          }}
                        >
                          بروزرسانی آمار
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(
                            `/admin/notifications/${item.id}/stats`,
                            "_blank",
                          );
                        }}
                        style={{
                          ...secondaryBtn,
                          padding: "6px 10px",
                          fontSize: 11,
                        }}
                      >
                        مشاهده آمار
                      </button>
                    )}
                  </td>

                  <td style={tdStyle}>{item.createdBy?.name || "—"}</td>

                  <td style={tdStyle}>{formatDate(item.scheduledAt)}</td>

                  <td style={tdStyle}>{formatDate(item.sentAt)}</td>

                  <td style={tdStyle}>{formatDate(item.createdAt)}</td>

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
                    colSpan={14}
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
  width: "100%",
  marginTop: 10,
  padding: "10px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#111827",
  color: "#fff",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const tdStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "middle",
};
