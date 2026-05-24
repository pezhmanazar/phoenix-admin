// src/app/admin/tickets/[id]/MessagesList.client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import VoicePlayer from "./VoicePlayer.client";

export type Message = {
  id: string;
  ticketId: string;
  sender: "user" | "admin";
  text?: string | null;
  createdAt?: string;
  ts?: string;
  type?: "text" | "voice" | "image" | "file";
  fileUrl?: string | null;
  signedUrl?: string | null;
  fileSignedUrl?: string | null;
  mime?: string | null;
  durationSec?: number | null;
};

type Props = {
  messages: Message[];
  userName: string;
  backendBase: string;
  adminToken: string;
};

function safePersianDate(when?: string) {
  if (!when) return "";
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString("fa-IR-u-ca-persian", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return d.toISOString();
  }
}

export default function MessagesList({ messages, userName, backendBase, adminToken }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const stableVoiceUrlsRef = useRef<Record<string, string>>({});
  const didInitialScrollRef = useRef(false);

    console.log("MESSAGES_LIST_PROPS", {
    backendBase,
    messagesCount: messages?.length,
  });

  // برای تریگر کردن اسکرول بعد از لود مدیا
  const [mediaTick, setMediaTick] = useState(0);

  // فقط پیام‌هایی که مدیا دارند
  const mediaCount = useMemo(() => {
    if (!messages?.length) return 0;
    return messages.filter((m) => !!m.fileUrl && (m.type === "image" || m.type === "voice" || m.type === "file")).length;
  }, [messages]);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    // روش قابل اعتماد: ته لیست را scrollIntoView کن
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const isNearBottom = () => {
  const el = scrollRef.current;
  if (!el) return true;

  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

  return distanceFromBottom < 120;
};

// فقط ورود اولیه را ببر آخر پیام‌ها
// بعد از آن فقط اگر کاربر نزدیک پایین بود، auto-scroll کن
useEffect(() => {
  if (!didInitialScrollRef.current) {
    didInitialScrollRef.current = true;

    scrollToBottom("auto");
    const t = setTimeout(() => scrollToBottom("auto"), 50);

    return () => clearTimeout(t);
  }

  if (isNearBottom()) {
    scrollToBottom("auto");
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [messages?.length]);

// وقتی مدیا لود شد، فقط اگر کاربر نزدیک پایین است اسکرول کن
useEffect(() => {
  if (!mediaCount) return;
  if (!isNearBottom()) return;

  scrollToBottom("auto");

  const t = setTimeout(() => {
    if (isNearBottom()) {
      scrollToBottom("auto");
    }
  }, 80);

  return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mediaTick]);


  // اسکرول وقتی ارتفاع کانتینر تغییر کرد (مثلا بعد از لود تصاویر)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // اگر ResizeObserver نبود، بیخیال
    if (typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
  if (isNearBottom()) {
    scrollToBottom("auto");
  }
});

    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: url ساختن
    const buildFullUrl = (fileUrl?: string | null) => {
  const rel = (fileUrl || "").trim();
  if (!rel) return null;

  if (rel.startsWith("http://") || rel.startsWith("https://")) {
    return rel;
  }

  const base = backendBase?.trim().replace(/\/+$/, "") || "";

  if (!base) return null;

  return rel.startsWith("/") ? `${base}${rel}` : `${base}/${rel}`;
};

const getStableMediaUrl = (m: Message) => {
  const rawUrl = m.signedUrl || m.fileSignedUrl || buildFullUrl(m.fileUrl) || "";

  if (!rawUrl) return "";

  // فقط برای ویس URL را ثابت نگه می‌داریم
  // چون audio با تغییر src وسط لود، request را cancel می‌کند
  if (m.type === "voice") {
    const existing = stableVoiceUrlsRef.current[m.id];

    if (existing) {
      return existing;
    }

    stableVoiceUrlsRef.current[m.id] = rawUrl;
    return rawUrl;
  }

  return rawUrl;
};


  const bumpMediaTick = () => {
    // اگر چند مدیا پشت هم لود شد، tick را افزایش بده
    setMediaTick((x) => x + 1);
  };

  return (
    <div
      ref={scrollRef}
      data-ticket-scroll="1"
      style={{
        flex: 1,
        minHeight: 0,
        maxHeight: "100%",
        overflowY: "auto",
        paddingRight: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "8px",
      }}
    >
      {messages && messages.length ? (
        messages.map((m) => {
          const mine = m.sender === "admin";
          const when = m.createdAt || m.ts || undefined;

          const fullUrl = getStableMediaUrl(m);
          console.log("ADMIN_MEDIA_DEBUG", {
  messageId: m.id,
  type: m.type,
  fileUrl: m.fileUrl,
  signedUrl: m.signedUrl,
  fileSignedUrl: m.fileSignedUrl,
  fullUrl,
});


          const type: Message["type"] = m.type || "text";
          const senderLabel = mine ? "پشتیبانی ققنوس" : userName;

          const bubbleStyle: React.CSSProperties = {
            maxWidth: "85%",
            padding: "10px 12px",
            borderRadius: "14px",
            border: "1px solid",
            borderColor: mine ? "#ea580c" : "#333",
            backgroundColor: mine ? "#ea580c" : "#000",
            alignSelf: mine ? "flex-start" : "flex-end",
            fontSize: "13px",
          };

          const metaStyle: React.CSSProperties = {
            fontSize: "11px",
            marginBottom: 4,
            color: mine
              ? "rgba(255,255,255,0.85)"
              : "rgba(249,250,251,0.7)",
          };

          const dateText = safePersianDate(when);

          return (
            <div key={m.id} style={bubbleStyle}>
              <div style={metaStyle}>
                {senderLabel}
                {dateText ? (
                  <span style={{ marginInline: 6, opacity: 0.7 }}>
                    • {dateText}
                  </span>
                ) : null}
              </div>

              {m.text ? (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    marginBottom: type === "text" || !fullUrl ? 0 : 6,
                  }}
                >
                  {m.text}
                </div>
              ) : null}

              {type === "image" ? (
  fullUrl ? (
    <img
      src={fullUrl}
      alt="image"
      loading="lazy"
      onLoad={bumpMediaTick}
      onError={() => {
        console.log("ADMIN_IMAGE_ERROR", {
          messageId: m.id,
          fileUrl: m.fileUrl,
          fullUrl,
        });
        bumpMediaTick();
      }}
      style={{
        maxHeight: "280px",
        borderRadius: "10px",
        border: "1px solid #374151",
        marginTop: m.text ? 6 : 0,
        display: "block",
      }}
    />
  ) : (
    <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>در حال بارگذاری تصویر...</div>
  )
) : type === "voice" ? (
  fullUrl ? (
    <div style={{ marginTop: 4 }} onLoadCapture={bumpMediaTick}>
      <VoicePlayer src={fullUrl} />
    </div>
  ) : (
    <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>در حال بارگذاری ویس...</div>
  )
) : type === "file" ? (
  fullUrl ? (
    <a
      href={fullUrl}
      download
      style={{
        display: "inline-block",
        marginTop: 4,
        fontSize: "12px",
        color: "rgba(255,255,255,0.9)",
        textDecoration: "underline",
      }}
    >
      دانلود فایل
    </a>
  ) : (
    <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>در حال آماده‌سازی فایل...</div>
  )
) : null}
            </div>
          );
        })
      ) : (
        <div
          style={{
            fontSize: "13px",
            color: "rgba(156,163,175,0.9)",
          }}
        >
          هنوز پیامی ثبت نشده.
        </div>
      )}

      {/* ✅ ته لیست برای اسکرول دقیق */}
      <div ref={bottomRef} />
    </div>
  );
}