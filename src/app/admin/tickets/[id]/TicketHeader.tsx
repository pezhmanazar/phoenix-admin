// src/app/admin/tickets/[id]/TicketHeader.tsx
import Link from "next/link";
import {
  ArrowRightIcon,
  UserIcon,
  SparklesIcon,
  CakeIcon,
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

  // جنسیت + رنگ
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

  const typeTitle =
    ticketType === "tech" ? "پشتیبانی فنی" : "ارتباط با درمانگر";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid #1F2937",
        background:
          "linear-gradient(90deg, #020617, #020617 10%, #020b3a 60%, #020617 100%)",
        minHeight: 42,
      }}
    >
      {/* بازگشت */}
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
          background: "radial-gradient(circle at 30% 30%, #0f172a, #020617)",
          color: "rgba(248,250,252,0.9)",
          flexShrink: 0,
        }}
      >
        <ArrowRightIcon className="w-4 h-4" />
      </Link>

      {/* نام + شماره */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          color: "rgba(248,250,252,0.95)",
        }}
      >
        <span
          title={userName}
          style={{
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 180,
          }}
        >
          {userName}
        </span>

        <span style={{ opacity: 0.85, whiteSpace: "nowrap", fontSize: 12 }}>
          {phone}
        </span>
      </div>

      {/* آیتم‌ها سمت چپ */}
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
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.55)",
            backgroundColor: "rgba(15,23,42,0.7)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(248,250,252,0.9)",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          <UserIcon className="w-4 h-4" style={{ color: genderColor }} />
          <span style={{ opacity: 0.9 }}>{genderTitle}</span>
        </div>

        {/* سن */}
        <div
          title="سن"
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.55)",
            backgroundColor: "rgba(15,23,42,0.7)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(248,250,252,0.9)",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          <CakeIcon className="w-4 h-4" />
          <span style={{ opacity: 0.9 }}>{ageLabel}</span>
        </div>

        {/* اشتراک */}
        <div
          title={planDescription}
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.5)",
            backgroundColor: planBg,
            color: planColor,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          <SparklesIcon className="w-4 h-4" />
          <span>{planChipText}</span>
        </div>

        {/* نوع تیکت */}
        <div
          title={typeTitle}
          style={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15,23,42,0.7)",
            color: "rgba(248,250,252,0.9)",
            flexShrink: 0,
          }}
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}