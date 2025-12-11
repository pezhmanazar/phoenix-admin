// src/app/admin/tickets/[id]/MessagesList.client.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
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

export default function MessagesList({ messages, userName, backendBase }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // base نهایی مدیا که واقعا استفاده می‌کنیم
  const [mediaBase, setMediaBase] = useState<string>("");

  // همیشه روی آخرین پیام بمان
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages?.length]);

  // محاسبه mediaBase (یا از prop یا از window.location)
  useEffect(() => {
    // اگر از سرور base داده شده، همان را نرمال‌سازی کن
    if (backendBase && backendBase.trim()) {
      setMediaBase(backendBase.trim().replace(/\/+$/, ""));
      return;
    }

    // در غیر این صورت، از دامین فعلی روی کلاینت کمک بگیر
    if (typeof window !== "undefined") {
      const { protocol, host } = window.location; // host شامل پورت هست اگر باشد
      let finalHost = host;

      // اگر روی admin.qoqnoos.app هستیم، admin. را حذف کن
      if (/^admin\./i.test(finalHost)) {
        finalHost = finalHost.replace(/^admin\./i, "");
      }

      const base = `${protocol}//${finalHost}`.replace(/\/+$/, "");
      setMediaBase(base);
    }
  }, [backendBase]);

  return (
    <div
      ref={scrollRef}
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

          const rel = (m.fileUrl || "").toString();
          let fullUrl: string | null = null;

          if (!rel) {
            fullUrl = null;
          } else if (rel.startsWith("http://") || rel.startsWith("https://")) {
            // بک‌اند خودش آدرس کامل داده
            fullUrl = rel;
          } else if (rel.startsWith("/")) {
            // مسیر از ریشه؛ اگر mediaBase داریم، با آن concat می‌کنیم
            if (mediaBase) {
              fullUrl = `${mediaBase}${rel}`;
            } else {
              // fallback: همان مسیر نسبی (در بدترین حالت از دامین فعلی لود می‌شود)
              fullUrl = rel;
            }
          } else {
            // مسیر نسبی بدون اسلش
            fullUrl = mediaBase ? `${mediaBase}/${rel}` : `/${rel}`;
          }

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

          return (
            <div key={m.id} style={bubbleStyle}>
              <div style={metaStyle}>
                {senderLabel}
                {when ? (
                  <span style={{ marginInline: 6, opacity: 0.7 }}>
                    •{" "}
                    {new Date(when).toLocaleString("fa-IR-u-ca-persian", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
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