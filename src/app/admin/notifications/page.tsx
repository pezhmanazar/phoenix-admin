//\phoenix-admin\src\app\admin\notifications\page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";

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
  data: unknown;
  type: CampaignType;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  archivedAt: string | null;
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

function getCampaignRoute(value: unknown): string {
  if (typeof value === "object" && value !== null && "route" in value) {
    const route = (value as { route?: unknown }).route;

    return typeof route === "string" ? route : "";
  }

  return "";
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
  const [archiveView, setArchiveView] = useState<"active" | "archived">(
    "active",
  );
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    pushTitle: "",
    pushBody: "",
    type: "therapeutic" as CampaignType,
    notificationType: "marketing",
    route: "",
    targetRule: {
      plan: "all",
      appProvider: "all",
    },
  });

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
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api<CampaignListResponse>(
        `/admin/api/notification-campaigns?page=1&limit=50&archive=${archiveView}`,
      );

      setItems(result.data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [archiveView]);

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

  function openEditCampaign(item: NotificationCampaign) {
    if (item.status !== "draft") {
      alert("فقط کمپین‌های پیش‌نویس قابل ویرایش هستند.");
      return;
    }

    const targetRule = getTargetRule(item.targetRule);

    setEditingId(item.id);

    setEditForm({
      title: item.title || "",
      description: item.description || "",
      pushTitle: item.pushTitle || "",
      pushBody: item.pushBody || "",
      type: item.type,
      notificationType: item.notificationType || "marketing",
      route: getCampaignRoute(item.data),
      targetRule: {
        plan: targetRule.plan || "all",
        appProvider: targetRule.appProvider || "all",
      },
    });

    setEditOpen(true);
  }

  async function saveEditCampaign() {
    if (!editingId) return;

    if (!editForm.title.trim()) {
      alert("عنوان کمپین را وارد کنید.");
      return;
    }

    if (!editForm.pushTitle.trim() || !editForm.pushBody.trim()) {
      alert("عنوان و متن Push را وارد کنید.");
      return;
    }

    setEditSaving(true);

    try {
      const res = await fetch(
        `/admin/api/notification-campaigns/${editingId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            pushTitle: editForm.pushTitle,
            pushBody: editForm.pushBody,
            type: editForm.type,
            notificationType: editForm.notificationType,
            data: editForm.route
              ? {
                  route: editForm.route,
                }
              : null,
            targetRule: editForm.targetRule,
          }),
        },
      );

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "UPDATE_FAILED");
      }

      setEditOpen(false);
      setEditingId(null);

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در ویرایش کمپین");
    } finally {
      setEditSaving(false);
    }
  }
  async function duplicateCampaign(id: string) {
    const ok = confirm("از این کمپین یک نسخه جدید به‌صورت پیش‌نویس ساخته شود؟");

    if (!ok) return;

    try {
      const res = await fetch(
        `/admin/api/notification-campaigns/${id}/duplicate`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "DUPLICATE_FAILED");
      }

      alert("نسخه کپی کمپین ساخته شد.");

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در کپی کمپین");
    }
  }

  async function deleteCampaign(id: string) {
    const ok = confirm(
      "این پیش‌نویس برای همیشه حذف شود؟\nاین عملیات قابل بازگشت نیست.",
    );

    if (!ok) return;

    try {
      const res = await fetch(
        `/admin/api/notification-campaigns/${id}/delete`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "DELETE_FAILED");
      }

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در حذف کمپین");
    }
  }

  async function archiveCampaign(id: string, currentlyArchived: boolean) {
    const ok = confirm(
      currentlyArchived
        ? "این کمپین از آرشیو خارج شود؟"
        : "این کمپین آرشیو شود؟",
    );

    if (!ok) return;

    try {
      const res = await fetch(
        `/admin/api/notification-campaigns/${id}/archive`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "ARCHIVE_FAILED");
      }

      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطا در تغییر وضعیت آرشیو");
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
  }, [load]);

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

        {editOpen ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
            }}
          >
            <div
              style={{
                width: 420,
                maxHeight: "90vh",
                overflowY: "auto",
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
                ویرایش کمپین
              </h2>

              <input
                placeholder="عنوان کمپین"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    title: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <textarea
                placeholder="توضیحات"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
                value={editForm.pushTitle}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    pushTitle: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <textarea
                placeholder="متن نوتیفیکیشن (Push Body)"
                value={editForm.pushBody}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    pushBody: e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: 80,
                }}
              />

              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
                value={editForm.route}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
                value={editForm.targetRule.plan}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    targetRule: {
                      ...editForm.targetRule,
                      plan: e.target.value,
                    },
                  })
                }
                style={inputStyle}
              >
                <option value="all">همه وضعیت‌های اشتراک</option>
                <option value="free">رایگان</option>
                <option value="pro">پرو فعال</option>
                <option value="expiring">در حال انقضا (۷ روز آینده)</option>
                <option value="expired">منقضی‌شده</option>
              </select>

              <select
                value={editForm.targetRule.appProvider}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    targetRule: {
                      ...editForm.targetRule,
                      appProvider: e.target.value,
                    },
                  })
                }
                style={inputStyle}
              >
                <option value="all">همه نسخه‌های اپ</option>
                <option value="bazaar">کافه‌بازار</option>
                <option value="direct">نسخه مستقیم / زرین‌پال</option>
              </select>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => void saveEditCampaign()}
                  disabled={editSaving}
                  style={{
                    ...primaryBtn,
                    opacity: editSaving ? 0.6 : 1,
                  }}
                >
                  {editSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>

                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => {
                    setEditOpen(false);
                    setEditingId(null);
                  }}
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
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setArchiveView("active")}
            style={{
              ...viewTabStyle,
              ...(archiveView === "active" ? activeViewTabStyle : {}),
            }}
          >
            کمپین‌ها
          </button>

          <button
            type="button"
            onClick={() => setArchiveView("archived")}
            style={{
              ...viewTabStyle,
              ...(archiveView === "archived" ? activeViewTabStyle : {}),
            }}
          >
            آرشیو
          </button>
        </div>

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
                    {item.status === "draft" ? (
                      <span style={{ opacity: 0.45 }}>ارسال نشده</span>
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
                          ...actionBtnStyle,
                          ...copyActionBtnStyle,
                        }}
                      >
                        آمار
                      </button>
                    )}
                  </td>
                  <td style={tdStyle}>{item.createdBy?.name || "—"}</td>

                  <td style={tdStyle}>{formatDate(item.scheduledAt)}</td>

                  <td style={tdStyle}>{formatDate(item.sentAt)}</td>

                  <td style={tdStyle}>{formatDate(item.createdAt)}</td>

                  <td style={tdStyle}>
                    <div style={actionsWrapStyle}>
                      <button
                        type="button"
                        onClick={() => void duplicateCampaign(item.id)}
                        style={{
                          ...actionBtnStyle,
                          ...copyActionBtnStyle,
                        }}
                      >
                        کپی
                      </button>

                      {item.status === "draft" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditCampaign(item)}
                            style={{
                              ...actionBtnStyle,
                              ...editActionBtnStyle,
                            }}
                          >
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => void sendCampaign(item.id)}
                            style={{
                              ...actionBtnStyle,
                              ...sendActionBtnStyle,
                            }}
                          >
                            ارسال
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteCampaign(item.id)}
                            style={{
                              ...actionBtnStyle,
                              ...deleteActionBtnStyle,
                            }}
                          >
                            حذف
                          </button>
                        </>
                      ) : null}

                      {item.status === "completed" ||
                      item.status === "failed" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void archiveCampaign(
                              item.id,
                              Boolean(item.archivedAt),
                            )
                          }
                          style={{
                            ...actionBtnStyle,
                            ...archiveActionBtnStyle,
                          }}
                        >
                          {item.archivedAt ? "بازگردانی" : "آرشیو"}
                        </button>
                      ) : null}
                    </div>
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
                    {archiveView === "archived"
                      ? "هنوز کمپینی آرشیو نشده است."
                      : "هنوز کمپینی ساخته نشده است."}
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

const actionsWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  flexWrap: "wrap",
};

const actionBtnStyle: React.CSSProperties = {
  minWidth: 62,
  height: 32,
  padding: "0 10px",
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const copyActionBtnStyle: React.CSSProperties = {
  borderColor: "#374151",
  background: "#111827",
  color: "#e5e7eb",
};

const editActionBtnStyle: React.CSSProperties = {
  borderColor: "#92400e",
  background: "rgba(146,64,14,.18)",
  color: "#fbbf24",
};

const sendActionBtnStyle: React.CSSProperties = {
  borderColor: "#166534",
  background: "rgba(20,83,45,.75)",
  color: "#dcfce7",
};

const deleteActionBtnStyle: React.CSSProperties = {
  borderColor: "#991b1b",
  background: "rgba(127,29,29,.22)",
  color: "#fca5a5",
};

const archiveActionBtnStyle: React.CSSProperties = {
  borderColor: "#4c1d95",
  background: "rgba(76,29,149,.18)",
  color: "#c4b5fd",
};

const viewTabStyle: React.CSSProperties = {
  minWidth: 100,
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#9ca3af",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const activeViewTabStyle: React.CSSProperties = {
  borderColor: "#8b6b36",
  background: "rgba(212,175,55,.12)",
  color: "#D4AF37",
};
const tdStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #0b1220",
  color: "rgba(255,255,255,0.86)",
  verticalAlign: "middle",
};
