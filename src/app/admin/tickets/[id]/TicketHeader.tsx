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

  const typeFa = ticketType === "tech" ? "درمان" : "پشتیبانی";
  const TypeIcon = ticketType === "tech" ? HeartIcon : WrenchScrewdriverIcon;

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
        gap: 12,
        direction: "rtl", // ✅ کل هدر RTL
      }}
    >
      {/* ✅ RIGHT SIDE (چسبیده به راست): فلش بعد اسم */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "flex-end",
          flexShrink: 0,
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
          }}
        >
          {userName}
        </div>
      </div>

      {/* ✅ LEFT SIDE (چسبیده به چپ): ... سپس نوع سپس بقیه */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "flex-start",
          flexWrap: "wrap",
          minWidth: 0,
          // ✅ برای اینکه بچسبه به چپ، توی RTL از margin-right:auto استفاده می‌کنیم
          marginRight: "auto",
        }}
      >
        {/* سه نقطه */}
        <TicketActionsMenu ticketId={ticketId} pinned={pinned} />

        {/* نوع تیکت */}
        <span style={pill("dark")}>
          <TypeIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
          {typeFa}
        </span>

        {/* اشتراک */}
        <span style={pill(planTone)} title={planDescription}>
          {planChipText}
        </span>

        {/* سن فقط عدد */}
        <span style={pill("dark")}>
          سن
          <span style={{ opacity: 0.9 }}> {ageNum}</span>
        </span>

        {/* جنسیت با آیکن */}
        <span style={pill("dark")}>
          <UserIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
          {genderFa(gender)}
        </span>

        {/* شماره */}
        <span style={pill("dark")}>
          <PhoneIcon style={{ width: 14, height: 14, opacity: 0.9 }} />
          {phone}
        </span>
      </div>
    </div>
  );
}