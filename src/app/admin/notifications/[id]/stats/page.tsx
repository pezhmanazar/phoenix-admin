//src/app/admin/notifications/[id]/stats/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

type CampaignStats = {
  campaignId: string;
  status: string;

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

  sentAt: string | null;
};

export default function NotificationCampaignStatsPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params?.id || "");

  const [stats, setStats] = useState<CampaignStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

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

      setStats(json.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت آمار");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            آمار کمپین نوتیفیکیشن
          </h1>

          <div
            style={{
              marginTop: 6,
              color: "rgba(255,255,255,.55)",
              fontSize: 12,
            }}
          >
            Campaign ID: {id}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => void loadStats()}
            style={secondaryBtn}
          >
            بروزرسانی آمار
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/notifications")}
            style={secondaryBtn}
          >
            بازگشت
          </button>
        </div>
      </div>

      {loading ? (
        <div style={stateBox}>در حال دریافت آمار...</div>
      ) : error ? (
        <div
          style={{
            ...stateBox,
            borderColor: "#7f1d1d",
            background: "#2a0b10",
            color: "#fecaca",
          }}
        >
          خطا: {error}
        </div>
      ) : stats ? (
        <>
          <div style={gridStyle}>
            <StatCard title="کاربران هدف" value={stats.targetUsers} />

            <StatCard title="ارسال موفق" value={stats.successfulUsers} />

            <StatCard title="ناموفق" value={stats.failedUsers} />

            <StatCard title="خوانده‌شده" value={stats.readUsers} />

            <StatCard title="بازشده از Push" value={stats.openedPushUsers} />

            <StatCard title="نرخ موفقیت" value={`${stats.successRate}٪`} />

            <StatCard title="نرخ خواندن" value={`${stats.readRate}٪`} />

            <StatCard
              title="نرخ بازشدن Push"
              value={`${stats.pushOpenRate}٪`}
            />
          </div>

          <div style={chartCardStyle}>
            <div style={chartHeaderStyle}>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  عملکرد کمپین
                </h2>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: "rgba(255,255,255,.5)",
                  }}
                >
                  مقایسه نرخ تعامل کاربران با این کمپین
                </div>
              </div>
            </div>

            <div style={chartRowsStyle}>
              <MetricBar
                label="ارسال موفق"
                value={stats.successRate}
                count={stats.successfulUsers}
                tone="success"
              />

              <MetricBar
                label="خوانده‌شده"
                value={stats.readRate}
                count={stats.readUsers}
                tone="read"
              />

              <MetricBar
                label="بازشده از Push"
                value={stats.pushOpenRate}
                count={stats.openedPushUsers}
                tone="push"
              />
            </div>
          </div>

          <div
            style={{
              maxWidth: 1000,
              margin: "20px auto 0",
              borderRadius: 16,
              border: "1px solid #1f2937",
              background: "#050a12",
              padding: 18,
            }}
          >
            <h2
              style={{
                color: "#fff",
                marginTop: 0,
                fontSize: 16,
              }}
            >
              جزئیات فنی ارسال
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              <Detail label="تلاش برای ارسال" value={stats.attemptedUsers} />

              <Detail label="دستگاه‌های موفق" value={stats.successfulDevices} />

              <Detail label="دستگاه‌های ناموفق" value={stats.failedDevices} />

              <Detail label="وضعیت کمپین" value={stats.status} />

              <Detail
                label="زمان ارسال"
                value={
                  stats.sentAt
                    ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                        timeZone: "Asia/Tehran",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(stats.sentAt))
                    : "—"
                }
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #1f2937",
        background: "linear-gradient(180deg,#07101c,#050a12)",
        padding: 18,
        minHeight: 105,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,.55)",
          fontSize: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#fff",
          fontSize: 26,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  count,
  tone,
}: {
  label: string;
  value: number;
  count: number;
  tone: "success" | "read" | "push";
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  const toneStyle =
    tone === "success"
      ? {
          background: "linear-gradient(90deg,#166534,#22c55e)",
        }
      : tone === "read"
        ? {
            background: "linear-gradient(90deg,#92400e,#d4af37)",
          }
        : {
            background: "linear-gradient(90deg,#4c1d95,#8b5cf6)",
          };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
          gap: 10,
        }}
      >
        <div
          style={{
            color: "#e5e7eb",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {label}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,.45)",
              fontSize: 11,
            }}
          >
            {count} نفر
          </span>

          <span
            style={{
              minWidth: 54,
              textAlign: "left",
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {safeValue}٪
          </span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 11,
          borderRadius: 999,
          background: "#111827",
          border: "1px solid #1f2937",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: "100%",
            borderRadius: 999,
            transition: "width .3s ease",
            ...toneStyle,
          }}
        />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div
        style={{
          color: "rgba(255,255,255,.5)",
          fontSize: 11,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#e5e7eb",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: 12,
  maxWidth: 1000,
  margin: "0 auto",
};

const chartCardStyle: React.CSSProperties = {
  maxWidth: 1000,
  margin: "20px auto 0",
  padding: 20,
  borderRadius: 16,
  border: "1px solid #1f2937",
  background: "linear-gradient(180deg,#07101c,#050a12)",
};

const chartHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const chartRowsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const stateBox: React.CSSProperties = {
  padding: 20,
  borderRadius: 14,
  border: "1px solid #1f2937",
  background: "#050a12",
  color: "#e5e7eb",
};

const secondaryBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
