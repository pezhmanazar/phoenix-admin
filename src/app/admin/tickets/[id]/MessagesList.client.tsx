// src/app/admin/tickets/[id]/MessagesList.client.tsx
"use client";

import React, { useEffect, useRef } from "react";
import VoicePlayer from "./VoicePlayer.client";

/* ===== انواع لوکال ===== */

type Message = {
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
  backendBase: string;
  userName: string;
};

/* تشخیص نوع پیام (بر اساس mime یا url) */
function detectType(
  mime?: string | null,
  url?: string | null
): "text" | "voice" | "image" | "file" {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "voice";
  if (m && !m.startsWith("text/")) return "file";

  const u = (url || "").toLowerCase();
  if (u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".webp"))
    return "image";
  if (u.endsWith(".mp3") || u.endsWith(".wav") || u.endsWith(".m4a") || u.endsWith(".ogg"))
    return "voice";
  if (u) return "file";

  return "text";
}

/* ===== لیست پیام‌ها (کلاینت) ===== */

export default function MessagesList({ messages, backendBase, userName }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

  // هر بار تعداد پیام‌ها عوض شد → برو پایین
  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        minHeight: "260px", // حداقل ارتفاع برای ناحیه چت
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
        messages.map((m, idx) => {
          const mine = m.sender === "admin";
          const when = m.createdAt || m.ts;
          const rel = (m.fileUrl || "").toString();
          const hasFile = rel && rel.startsWith("/");
          const fullUrl = hasFile ? `${backendBase}${rel}` : null;

          const type = m.type || detectType(m.mime, m.fileUrl);
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

          const isLast = idx === messages.length - 1;

          return (
            <div
              key={m.id}
              style={bubbleStyle}
              ref={isLast ? lastMsgRef : undefined}
            >
              <div style={metaStyle}>
                {senderLabel}
                {when ? (
                  <span style={{ marginInline: 6, opacity: 0.7 }}>
                    • {new Date(when).toLocaleString("fa-IR")}
                  </span>
                ) : null}
              </div>

              {m.text ? (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    marginBottom:
                      type === "text" || !fullUrl ? 0 : 6,
                  }}
                >
                  {m.text}
                </div>
              ) : null}

              {type === "image" && fullUrl ? (
                <img
                  src={fullUrl}
                  alt="image"
                  style={{
                    maxHeight: "280px",
                    borderRadius: "10px",
                    border: "1px solid #374151",
                    marginTop: m.text ? 6 : 0,
                  }}
                />
              ) : type === "voice" && fullUrl ? (
                <div style={{ marginTop: 4 }}>
                  <VoicePlayer src={fullUrl} />
                </div>
              ) : type === "file" && fullUrl ? (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
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
    </div>
  );
}