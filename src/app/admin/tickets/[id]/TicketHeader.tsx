"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TicketActionsMenu from "./TicketActionsMenu.client";
import {
  WrenchScrewdriverIcon,
  HeartIcon,
  UserIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";

function pill(tone: "dark" | "green" | "blue" = "dark"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  if (tone === "green") {
    return {
      ...base,
      border: "1px solid rgba(16,185,129,0.35)",
      background: "rgba(16,185,129,0.10)",
      color: "rgba(167,243,208,0.95)",
    };
  }

  if (tone === "blue") {
    return {
      ...base,
      border: "1px solid rgba(59,130,246,0.35)",
      background: "rgba(59,130,246,0.10)",
      color: "rgba(191,219,254,0.95)",
    };
  }

  return base;
}

function genderFa(g?: string | null) {
  if (g === "male") return "مرد";
  if (g === "female") return "زن";
  if (g === "other") return "سایر";
  return "نامشخص";
}

function extractNum(s: string) {
  const m = s.match(/[0-9۰-۹]+/);
  return m ? m[0] : "—";
}

export default function TicketHeader({
  ticketId,
  pinned,
  userName,
  phone,
  ageLabel,
  gender,
  planChipText,
  planDescription,
  ticketType,
}: {
  ticketId: string;
  pinned: boolean;
  userName: string;
  phone: string;
  ageLabel: string;
  gender: "male" | "female" | "other" | null;
  planChipText: string;
  planDescription: string;
  ticketType: "tech" | "therapy";
}) {
  const router = useRouter();

  // ✅ درست: therapy => قلب، tech => آچار
  const TypeIcon = ticketType === "therapy" ? HeartIcon : WrenchScrewdriverIcon;

  const planTone: "dark" | "green" | "blue" =
    planChipText === "PRO" || planChipText === "VIP"
      ? "green"
      : planChipText === "EXPIRED"
      ? "blue"
      : "dark";

  const ageNum = extractNum(ageLabel);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: "10px 12px",
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(90deg, rgba(2,6,23,0.85), rgba(17,24,39,0.55))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        // ✅ ترفند: برای اینکه "چپ/راست" دقیقاً فیزیکی بشه، کانتینر رو LTR می‌ذاریم
        // ولی متن‌ها/RTL داخل آیتم‌ها مشکلی ندارن.
        direction: "ltr",
        gap: 12,
      }}
    >
      {/* ✅ LEFT (چسبیده به چپ): ... سپس به سمت راست: typeIcon, plan, phone, gender, age */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,

          // چسبیده به لبه چپ
          justifyContent: "flex-start",

          // ترتیب دقیق چپ→راست
          direction: "ltr",

          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        {/* سه نقطه چسبیده به چپ */}
        <TicketActionsMenu ticketId={ticketId} pinned={pinned} />

        {/* فقط آیکن نوع تیکت */}
        <span style={pill("dark")} title={ticketType === "therapy" ? "درمان" : "پشتیبانی"}>
          <TypeIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
        </span>

        {/* بج اشتراک */}
        <span style={pill(planTone)} title={planDescription}>
          {planChipText}
        </span>

        {/* شماره */}
        <span style={pill("dark")}>
          <PhoneIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
          {phone}
        </span>

        {/* جنسیت */}
        <span style={pill("dark")}>
          <UserIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
          {genderFa(gender)}
        </span>

        {/* سن فقط عدد */}
        <span style={pill("dark")}>{ageNum}</span>
      </div>

      {/* ✅ RIGHT (چسبیده به راست): فلش بعد اسم */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,

          // چسب به راست
          marginLeft: "auto",

          // برای اینکه فلش سمت راست و اسم بعدش بیاد
          direction: "rtl",
        }}
      >
        <button
          type="button"
          title="بازگشت"
          onClick={() => router.back()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          ➜
        </button>

        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "rgba(255,255,255,0.92)",
            whiteSpace: "nowrap",
            direction: "rtl",
          }}
        >
          {userName}
        </div>
      </div>
    </div>
  );
}