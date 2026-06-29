"use client";

import React, { useEffect, useState } from "react";

type PathStat = {
  path: string;
  totalViews: number;
  uniqueVisitors: number;
};

type DailyStat = {
  date: string;
  path: string;
  views: number;
  visitors: number;
};

type DailyChartItem = {
  date: string;
  views: number;
};


type AnalyticsData = {
  daysRange: number;
  totalViews: number;
  pathStats: PathStat[];
  chartData: DailyStat[];
};

export default function WebsiteAnalyticsPage() {
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  async function fetchStats(selectedDays: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics/views?days=${selectedDays}&ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "خطا در دریافت اطلاعات");
      }
      setData(result.data);
    } catch (err: any) {
      setError(err.message || "مشکلی پیش آمده");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats(days);
  }, [days]);

  const dailyChartData: DailyChartItem[] = React.useMemo(() => {
    const grouped: Record<string, number> = {};

    (data?.chartData ?? []).forEach((item) => {
      const dateKey = item.date;
      grouped[dateKey] = (grouped[dateKey] || 0) + (item.views || 0);
    });

    return Object.entries(grouped)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);


  const maxDayViews = dailyChartData.length
    ? Math.max(...dailyChartData.map((d) => d.views), 1)
    : 1;

  function toPersianDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
}

  return (
    <div className="max-w-6xl mx-auto p-5 text-slate-200 dir-rtl">
      
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">آمار بازدید وب‌سایت</h1>
          <p className="text-xs text-slate-400 mt-1">تحلیل و بررسی ترافیک صفحات فرود و عمومی ققنوس</p>
        </div>

        {/* فیلتر روزها */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                days === d ? "bg-orange-600 text-white" : "bg-transparent text-slate-400 hover:text-white"
              }`}
            >
              {d} روز اخیر
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">در حال دریافت آمار بازدید...</div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 text-center">
          {error}
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-slate-400">داده‌ای یافت نشد.</div>
      ) : (
        <>         
         {/* کارت‌های آمار */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-white/10 rounded-2xl bg-white/5 p-5">
              <div className="text-xs text-slate-400 font-bold">کل بازدیدهای ثبت شده ({days} روز اخیر)</div>
              <div className="mt-2 text-3xl font-black text-amber-400">{(data.totalViews ?? 0).toLocaleString("fa-IR")}</div>
            </div>
            <div className="border border-white/10 rounded-2xl bg-white/5 p-5">
              <div className="text-xs text-slate-400 font-bold">صفحات فعال بازدید شده</div>
              <div className="mt-2 text-3xl font-black text-sky-400">{(data.pathStats?.length ?? 0).toLocaleString("fa-IR")}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* بخش نمودار میله‌ای روزانه */}
            <div className="border border-white/10 rounded-2xl bg-white/5 p-5">
              <h2 className="text-sm font-bold mb-5 text-slate-300">روند بازدید روزانه</h2>
              
              {dailyChartData.length === 0 ? (
  <div className="h-44 flex items-center justify-center text-sm text-slate-500 border border-dashed border-white/10 rounded-xl">
    داده‌ای برای نمایش نمودار وجود ندارد
  </div>
) : (
  <div className="flex items-end justify-around h-44 gap-2 pb-2 border-b border-white/10 dir-ltr bg-red-900/20">
    {dailyChartData.map((d, index) => {
      // محاسبه ارتفاع (حداقل ۱۰ درصد)
      const heightVal = Math.max((d.views / maxDayViews) * 100, 10);
      
      return (
        <div
          key={index}
          className="flex-1 flex flex-col items-center justify-end h-full"
          title={`${d.date}: ${d.views} بازدید`}
        >
          {/* این خودِ ستون است */}
          <div
  className="w-6 bg-sky-400 rounded-t-md"
  style={{ height: `${heightVal}%`, minHeight: "10px" }}
/>
          <span className="text-[9px] text-slate-400 mt-1">
            {toPersianDate(d.date)}
          </span>
        </div>
      );
    })}
  </div>
)}
            </div>

            {/* جدول بازدید صفحات */}
            <div className="border border-white/10 rounded-2xl bg-white/5 p-5">
              <h2 className="text-sm font-bold mb-4 text-slate-300 font-sans">بازدید بر اساس مسیرها (Paths)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-right">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 text-slate-400 font-bold">ردیف</th>
                      <th className="p-3 text-slate-400 font-bold">آدرس مسیر (Path)</th>
                      <th className="p-3 text-slate-400 font-bold text-left">تعداد کل بازدیدها</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.pathStats ?? []).map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 text-slate-500">{(idx + 1).toLocaleString("fa-IR")}</td>
                        <td className="p-3 text-left dir-ltr font-mono text-slate-200">{item.path}</td>
                        <td className="p-3 text-left font-bold text-amber-400">{(item.totalViews ?? 0).toLocaleString("fa-IR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
