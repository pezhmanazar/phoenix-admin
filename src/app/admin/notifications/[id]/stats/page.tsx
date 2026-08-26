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

  const [stats, setStats] =
    useState<CampaignStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadStats = useCallback(async () => {
  if (!id) return;

  setLoading(true);
  setError("");

  try {
    const res = await fetch(
      `/admin/api/notification-campaigns/${id}/stats`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const json = await res.json();

    if (!res.ok || json.ok === false) {
      throw new Error(
        json.error || "STATS_FAILED"
      );
    }

    setStats(json.stats);
  } catch (e) {
    setError(
      e instanceof Error
        ? e.message
        : "خطا در دریافت آمار"
    );
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
            onClick={() =>
              router.push(
                "/admin/notifications"
              )
            }
            style={secondaryBtn}
          >
            بازگشت
          </button>
        </div>
      </div>

      {loading ? (
        <div style={stateBox}>
          در حال دریافت آمار...
        </div>
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
            <StatCard
              title="کاربران هدف"
              value={stats.targetUsers}
            />

            <StatCard
              title="ارسال موفق"
              value={stats.successfulUsers}
            />

            <StatCard
              title="ناموفق"
              value={stats.failedUsers}
            />

            <StatCard
              title="خوانده‌شده"
              value={stats.readUsers}
            />

            <StatCard
              title="بازشده از Push"
              value={stats.openedPushUsers}
            />

            <StatCard
              title="نرخ موفقیت"
              value={`${stats.successRate}٪`}
            />

            <StatCard
              title="نرخ خواندن"
              value={`${stats.readRate}٪`}
            />

            <StatCard
              title="نرخ بازشدن Push"
              value={`${stats.pushOpenRate}٪`}
            />
          </div>

          <div
            style={{
              marginTop: 20,
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
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              <Detail
                label="تلاش برای ارسال"
                value={stats.attemptedUsers}
              />

              <Detail
                label="دستگاه‌های موفق"
                value={stats.successfulDevices}
              />

              <Detail
                label="دستگاه‌های ناموفق"
                value={stats.failedDevices}
              />

              <Detail
                label="وضعیت کمپین"
                value={stats.status}
              />

              <Detail
                label="زمان ارسال"
                value={
                  stats.sentAt
                    ? new Intl.DateTimeFormat(
                        "fa-IR-u-ca-persian",
                        {
                          timeZone:
                            "Asia/Tehran",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      ).format(
                        new Date(
                          stats.sentAt
                        )
                      )
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

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #1f2937",
        background:
          "linear-gradient(180deg,#07101c,#050a12)",
        padding: 18,
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
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
  gridTemplateColumns:
    "repeat(auto-fit,minmax(190px,1fr))",
  gap: 12,
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