// src/app/admin/tickets/[id]/TicketHeader.tsx
import Link from "next/link";
import {
  ArrowRightIcon,
  UserIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

type Props = {
  userName: string;
  phone: string;
  ageLabel: string;
  gender: "male" | "female" | "other" | null;
  planChipText: string; // FREE / PRO / EXPIRED ...
  planDescription: string;
  ticketType: "tech" | "therapy";
};

export default function TicketHeader({
  userName,
  phone,
  ageLabel,
  gender,
  planChipText,
  planDescription,
  ticketType,
}: Props) {
  // رنگ‌ها برای پلن
  let planBg = "#111827";
  let planColor = "#E5E7EB";
  if (planChipText === "PRO" || planChipText === "VIP") {
    planBg = "#064E3B";
    planColor = "#4ADE80";
  } else if (planChipText === "EXPIRED") {
    planBg = "#7F1D1D";
    planColor = "#FCA5A5";
  }

  // آیکن جنسیت + رنگ
  let genderColor = "#9CA3AF";
  if (gender === "male") genderColor = "#60A5FA";
  else if (gender === "female") genderColor = "#F472B6";

  const genderTitle =
    gender === "male"
      ? "مرد"
      : gender === "female"
      ? "زن"
      : gender === "other"
      ? "جنسیت دیگر"
      : "جنسیت نامشخص";

  const typeIcon =
    ticketType === "tech" ? (
      <WrenchScrewdriverIcon className="w-4 h-4" />
    ) : (
      <ChatBubbleLeftRightIcon className="w-4 h-4" />
    );

  const typeTitle =
    ticketType === "tech" ? "پشتیبانی فنی" : "ارتباط با درمانگر";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #1F2937",
        background:
          "linear-gradient(90deg, #020617, #020617 10%, #020b3a 60%, #020617 100%)",
        fontSize: 12,
        minHeight: 40,
      }}
    >
      {/* فلش خروج – رو به راست */}
      <Link
        href="/admin/tickets"
        aria-label="بازگشت به لیست تیکت‌ها"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.6)",
          background:
            "radial-gradient(circle at 30% 30%, #0f172a, #020617)",
          color: "rgba(248,250,252,0.9)",
          flexShrink: 0,
        }}
      >
        <ArrowRightIcon className="w-4 h-4" />
      </Link>

      {/* اسم، شماره، سن */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "rgba(248,250,252,0.9)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            maxWidth: 160,
          }}
        >
          {userName}
        </span>
        <span style={{ opacity: 0.8, whiteSpace: "nowrap" }}>
          {phone}
        </span>
        <span style={{ opacity: 0.7, whiteSpace: "nowrap" }}>
          {ageLabel}
        </span>
      </div>

      {/* آیکن‌ها – در سمت چپ نوار */}
      <div
        style={{
          marginRight: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* جنسیت */}
        <div
          title={genderTitle}
          style={{
            width: 22,
            height: 22,
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: genderColor,
            backgroundColor: "rgba(15,23,42,0.8)",
          }}
        >
          <UserIcon className="w-3.5 h-3.5" />
        </div>

        {/* نوع اشتراک */}
        <div
          title={planDescription}
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.5)",
            backgroundColor: planBg,
            color: planColor,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>{planChipText}</span>
        </div>

        {/* نوع چت: فنی / درمانگر */}
        <div
          title={typeTitle}
          style={{
            width: 22,
            height: 22,
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15,23,42,0.8)",
            color: "rgba(248,250,252,0.9)",
          }}
        >
          {typeIcon}
        </div>
      </div>
    </div>
  );
}