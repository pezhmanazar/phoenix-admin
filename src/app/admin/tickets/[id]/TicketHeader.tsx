"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TicketActionsMenu from "./TicketActionsMenu.client";

function pill(text: string, tone: "dark" | "green" | "blue" = "dark") {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
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

  const typeFa = ticketType === "tech" ? "پشتیبانی فنی" : "درمان";
  const planTone =
    planChipText === "PRO" || planChipText === "VIP"
      ? "green"
      : planChipText === "EXPIRED"
      ? "blue"
      : "dark";

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
      }}
    >
      {/* راست: فقط اسم + دکمه برگشت */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
          {userName}
        </div>

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
      </div>

      {/* چپ: همه اطلاعات داخل یک کادر و وسط‌چین */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          textAlign: "center",
          flex: 1,
        }}
      >
        <span style={pill(planChipText, planTone)} title={planDescription}>
          {planChipText}
        </span>

        <span style={pill(ageLabel)}>{ageLabel}</span>
        <span style={pill(genderFa(gender))}>{genderFa(gender)}</span>
        <span style={pill(phone)}>{phone}</span>

        {/* نوع تیکت + سه نقطه */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={pill(typeFa)}>{typeFa}</span>
          <TicketActionsMenu ticketId={ticketId} pinned={pinned} />
        </div>
      </div>
    </div>
  );
}