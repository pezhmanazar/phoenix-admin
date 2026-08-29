// phoenix-admin/src/app/admin/website-analytics/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type PathStat = {
  path: string;
  totalViews: number;
  uniqueVisitors: number;
};

type DailyChartItem = {
  date: string;
  views: number;
};

type AnalyticsData = {
  daysRange: number;
  totalViews: number;
  homeToDownloadCount: number;
  directDownloadClicks: number;
  conversionRate: number;
  landingUniqueVisitors: number;
  pathStats: PathStat[];
  chartData: DailyChartItem[];
};

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPersianDate(dateStr?: string | null) {
  const date = safeDate(dateStr);
  if (!date) return "-";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "#94a3b8",
  lineHeight: 1.8,
};

const wrapBase: React.CSSProperties = {
  maxWidth: 1280,
  marginInline: "auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  overflow: "hidden",
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.03)",
  padding: 14,
  minWidth: 0,
  height: "100%",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: 800,
};

const statValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 950,
  lineHeight: 1.2,
  wordBreak: "break-word",
};

const statHint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: "#64748b",
  lineHeight: 1.8,
};

const sectionTitle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 900,
  textAlign: "center",
};

const sectionBody: React.CSSProperties = {
  padding: 12,
};

const btnBase: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid #334155",
  backgroundColor: "#0b1220",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  border: "1px solid #7c2d12",
  backgroundColor: "#ea580c",
  color: "#fff",
};

function useViewport() {
  const [width, setWidth] = useState<number>(1200);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    width,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

function DailyBarChart({
  items,
  mobile,
  days,
}: {
  items: DailyChartItem[];
  mobile: boolean;
  days: number;
}) {
  const maxViews = Math.max(...items.map((i) => i.views), 0);

  const height = mobile ? 240 : 300;
  const plotHeight = height - 44;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isShortRange = days <= 7;

  /*
   * برای بازه‌های طولانی مثل ۳۰ و ۹۰ روز
   * باید نمودار واقعاً از container عریض‌تر شود
   * تا اسکرول افقی ایجاد شود.
   */
  const barSlotWidth = mobile ? 38 : 44;

  const chartMinWidth = Math.max(680, items.length * barSlotWidth + 54);

  useEffect(() => {
    if (days <= 7) return;

    const el = scrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    });

    return () => cancelAnimationFrame(frame);
  }, [days, items]);

  if (!items.length) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 12,
          color: "#94a3b8",
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.02)",
        }}
      >
        داده‌ای برای نمایش نمودار وجود ندارد
      </div>
    );
  }

  const gridLines = [25, 50, 75, 100];

  const yTicks = [
    maxViews,
    Math.round(maxViews * 0.75),
    Math.round(maxViews * 0.5),
    Math.round(maxViews * 0.25),
    0,
  ];

  return (
    <div
      ref={scrollRef}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",

        /*
         * اسکرول افقی در صفحات RTL بین مرورگرها
         * رفتار متفاوت دارد. wrapper را LTR نگه می‌داریم.
         */
        direction: "ltr",

        paddingBottom: 8,
        scrollbarGutter: "stable",
      }}
    >
      <div
        style={{
          width: chartMinWidth,
          minWidth: chartMinWidth,
          height,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          direction: "ltr",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flex: 1,
            position: "relative",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: 6,
          }}
        >
          {/* خطوط راهنمای افقی */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
            }}
          >
            {gridLines.map((line) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 0,
                  borderTop: "1px dashed rgba(148,163,184,0.16)",
                  transform: `translateY(${
                    (100 - line) * (plotHeight / 100)
                  }px)`,
                }}
              />
            ))}
          </div>

          {/* محور عمودی */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 34,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingTop: 2,
              paddingBottom: 22,
              color: "#64748b",
              fontSize: 10,
              pointerEvents: "none",
            }}
          >
            {yTicks.map((value, index) => (
              <span key={`${value}-${index}`}>
                {value.toLocaleString("fa-IR")}
              </span>
            ))}
          </div>

          {/* ستون‌ها */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "end",
              gap: isShortRange ? 12 : mobile ? 6 : 8,
              paddingLeft: 38,
              paddingRight: isShortRange ? 12 : 0,
              width: "100%",
            }}
          >
            {items.map((item, index) => {
              const h = maxViews
                ? clamp((item.views / maxViews) * 100, 6, 100)
                : 6;

              const isPeak = item.views === maxViews && maxViews > 0;

              return (
                <div
                  key={`${item.date}-${index}`}
                  style={{
                    flex: isShortRange ? "1 1 0" : "0 0 auto",
                    width: isShortRange ? "auto" : mobile ? 30 : 34,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "end",
                    height: "100%",
                  }}
                  title={`${item.date}: ${item.views} بازدید`}
                >
                  <div
                    style={{
                      width: isShortRange
                        ? mobile
                          ? 18
                          : 28
                        : mobile
                          ? 14
                          : 22,
                      height: `${h}%`,
                      minHeight: 8,
                      borderRadius: "8px 8px 0 0",
                      background: isPeak
                        ? "linear-gradient(180deg, rgba(251,146,60,1) 0%, rgba(234,88,12,1) 100%)"
                        : "linear-gradient(180deg, rgba(56,189,248,1) 0%, rgba(14,165,233,1) 100%)",
                      boxShadow: isPeak
                        ? "0 10px 20px rgba(234,88,12,0.25)"
                        : "0 8px 18px rgba(14,165,233,0.18)",
                      position: "relative",
                    }}
                  >
                    {isPeak ? (
                      <span
                        style={{
                          position: "absolute",
                          top: -22,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: 10,
                          color: "#fdba74",
                          whiteSpace: "nowrap",
                          fontWeight: 800,
                        }}
                      >
                        اوج
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#cbd5e1",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {toPersianDate(item.date)}
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 9,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.views.toLocaleString("fa-IR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtNum(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function WebsiteAnalyticsPage() {
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { isMobile, isTablet } = useViewport();

  async function fetchStats(selectedDays: number) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/analytics/views?days=${selectedDays}&ts=${Date.now()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "خطا در دریافت اطلاعات");
      }

      setData(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "مشکلی پیش آمده";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats(days);
  }, [days]);

  const dailyChartData = useMemo(() => {
    return [...(data?.chartData ?? [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [data?.chartData]);

  const sortedPathStats = useMemo(() => {
    return [...(data?.pathStats ?? [])].sort(
      (a, b) => b.totalViews - a.totalViews,
    );
  }, [data?.pathStats]);

  const totalViews = data?.totalViews ?? 0;
  const homeToDownloadCount = data?.homeToDownloadCount ?? 0;
  const directDownloadClicks = data?.directDownloadClicks ?? 0;
  const conversionRate = data?.conversionRate ?? 0;
  const activePaths = data?.pathStats?.length ?? 0;
  const landingUniqueVisitors = data?.landingUniqueVisitors ?? 0;

  return (
    <div
      style={{
        ...wrapBase,
        padding: isMobile ? 12 : 20,
        color: "#e2e8f0",
        direction: "rtl",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={title}>آمار بازدید وب‌سایت</h1>
          <p style={sub}>تحلیل و بررسی ترافیک صفحات عمومی ققنوس</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 4,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.03)",
            width: isMobile ? "100%" : "auto",
            justifyContent: "space-between",
          }}
        >
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={days === d ? btnActive : btnBase}
            >
              {d} روز اخیر
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{ padding: "56px 0", textAlign: "center", color: "#94a3b8" }}
        >
          در حال دریافت آمار بازدید...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(239,68,68,0.5)",
            backgroundColor: "rgba(239,68,68,0.08)",
            color: "#fca5a5",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : !data ? (
        <div
          style={{ padding: "56px 0", textAlign: "center", color: "#94a3b8" }}
        >
          داده‌ای یافت نشد.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={statCard}>
              <div style={statLabel}>کل بازدیدها ({days} روز اخیر)</div>
              <div style={{ ...statValue, color: "#f59e0b" }}>
                {fmtNum(totalViews)}
              </div>
              <div style={statHint}>جمع کل بازدیدها در بازه انتخابی</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>صفحات فعال بازدید شده</div>
              <div style={{ ...statValue, color: "#38bdf8" }}>
                {fmtNum(activePaths)}
              </div>
              <div style={statHint}>
                تعداد مسیرهای یکتایی که بازدید داشته‌اند
              </div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>بازدیدکنندگان یکتای لندینگ</div>
              <div style={{ ...statValue, color: "#22c55e" }}>
                {fmtNum(landingUniqueVisitors)}
              </div>
              <div style={statHint}>
                تعداد کاربران یکتای صفحه اصلی در بازه انتخابی
              </div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>ورود از خانه به دانلود</div>
              <div style={{ ...statValue, color: "#a78bfa" }}>
                {fmtNum(homeToDownloadCount)}
              </div>
              <div style={statHint}>تعداد ورود به صفحه دانلود از صفحه اصلی</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>کلیک دانلود مستقیم</div>
              <div style={{ ...statValue, color: "#fb7185" }}>
                {fmtNum(directDownloadClicks)}
              </div>
              <div style={statHint}>تعداد کلیک روی دکمه دانلود مستقیم</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>نرخ تبدیل دانلود</div>
              <div style={{ ...statValue, color: "#34d399" }}>
                {conversionRate.toLocaleString("fa-IR")}%
              </div>
              <div style={statHint}>نسبت کلیک دانلود به ورود از خانه</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div style={card}>
              <div style={sectionTitle}>روند بازدید روزانه</div>
              <div style={sectionBody}>
                <DailyBarChart
                  items={dailyChartData}
                  mobile={isMobile}
                  days={days}
                />
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>بازدید بر اساس مسیرها</div>
              <div style={sectionBody}>
                <div
                  style={{
                    overflowX: "auto",
                    maxWidth: "100%",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {" "}
                  <table
                    style={{
                      width: "100%",
                      minWidth: 720,
                      borderCollapse: "collapse",
                      fontSize: 12,
                      textAlign: "right",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <th
                          style={{
                            padding: 12,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          ردیف
                        </th>
                        <th
                          style={{
                            padding: 12,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          آدرس مسیر
                        </th>
                        <th
                          style={{
                            padding: 12,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          کل بازدیدها
                        </th>
                        <th
                          style={{
                            padding: 12,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          بازدیدکننده یکتا
                        </th>
                        <th
                          style={{
                            padding: 12,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          سهم از کل
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPathStats.map((item, idx) => (
                        <tr
                          key={`${item.path}-${idx}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <td style={{ padding: 12, color: "#94a3b8" }}>
                            {fmtNum(idx + 1)}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              fontFamily: "monospace",
                              direction: "ltr",
                              color: "#e2e8f0",
                              wordBreak: "break-all",
                            }}
                          >
                            {item.path}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              color: "#f59e0b",
                              fontWeight: 800,
                            }}
                          >
                            {fmtNum(item.totalViews || 0)}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              color: "#38bdf8",
                              fontWeight: 800,
                            }}
                          >
                            {fmtNum(item.uniqueVisitors || 0)}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              color: "#cbd5e1",
                              fontWeight: 700,
                            }}
                          >
                            {pct(item.totalViews || 0, totalViews)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
