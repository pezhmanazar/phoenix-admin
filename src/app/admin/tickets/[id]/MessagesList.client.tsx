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
  mime?: string | null;
  durationSec?: number | null;
};

type Props = {
  messages: Message[];
  userName: string;
  backendBase: string; // اختیاری؛ اگر خالی باشد، از window.location محاسبه می‌کنیم
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

export default function MessagesList({ messages, userName, backendBase }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // base نهایی مدیا
  const [mediaBase, setMediaBase] = useState<string>("");

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

  // محاسبه mediaBase (یا از prop یا از window.location)
  useEffect(() => {
    if (backendBase && backendBase.trim()) {
      setMediaBase(backendBase.trim().replace(/\/+$/, ""));
      return;
    }
    if (typeof window !== "undefined") {
      const { protocol, host } = window.location;
      let finalHost = host;
      if (/^admin\./i.test(finalHost)) {
        finalHost = finalHost.replace(/^admin\./i, "");
      }
      const base = `${protocol}//${finalHost}`.replace(/\/+$/, "");
      setMediaBase(base);
    }
  }, [backendBase]);

  // اسکرول وقتی پیام جدید میاد
  useEffect(() => {
    scrollToBottom("auto");
    // یک بار هم با تاخیر کوتاه (برای رندر اولیه)
    const t = setTimeout(() => scrollToBottom("auto"), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length]);

  // اسکرول وقتی مدیا لود شد (tick تغییر می‌کنه)
  useEffect(() => {
    if (!mediaCount) return;
    scrollToBottom("auto");
    // یک بار هم با تاخیر برای مواردی که لود/decoding طول می‌کشه
    const t = setTimeout(() => scrollToBottom("auto"), 80);
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
      scrollToBottom("auto");
    });

    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: url ساختن
  const buildFullUrl = (fileUrl?: string | null) => {
    const rel = (fileUrl || "").toString();
    if (!rel) return null;
    if (rel.startsWith("http://") || rel.startsWith("https://")) return rel;
    if (rel.startsWith("/")) return mediaBase ? `${mediaBase}${rel}` : rel;
    return mediaBase ? `${mediaBase}/${rel}` : `/${rel}`;
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

          const fullUrl = buildFullUrl(m.fileUrl);
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

              {type === "image" && fullUrl ? (
                <img
                  src={fullUrl}
                  alt="image"
                  loading="lazy"
                  onLoad={bumpMediaTick}
                  onError={bumpMediaTick}
                  style={{
                    maxHeight: "280px",
                    borderRadius: "10px",
                    border: "1px solid #374151",
                    marginTop: m.text ? 6 : 0,
                    display: "block",
                  }}
                />
              ) : type === "voice" && fullUrl ? (
                <div style={{ marginTop: 4 }} onLoadCapture={bumpMediaTick}>
                  <VoicePlayer src={fullUrl} />
                </div>
              ) : type === "file" && fullUrl ? (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    // کلیک روی فایل شاید رندر را تغییر ندهد، ولی اگر چیزی لود شود مشکلی نیست
                    // همینجا کاری لازم نداریم
                  }}
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