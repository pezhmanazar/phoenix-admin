// src/app/admin/tickets/[id]/ReplyForm.client.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

export default function ReplyForm({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const [recSupported, setRecSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    setRecSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices &&
        // @ts-ignore
        !!window.MediaRecorder
    );
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const f = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFile(f);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      alert("دسترسی میکروفن رد شد یا پشتیبانی نمی‌شود.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    if (sending) return;
    try {
      setSending(true);
      if (file) {
        const form = new FormData();
        form.append("file", file);
        if (text.trim()) form.append("text", text.trim());

        const r = await fetch(`/api/admin/tickets/${id}/reply-upload`, {
          method: "POST",
          body: form,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || "upload_failed");

        setText("");
        setFile(null);
        document.dispatchEvent(new CustomEvent("ticket-updated"));
      } else {
        const r = await fetch(`/api/admin/tickets/${id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || "send_failed");
        setText("");
        document.dispatchEvent(new CustomEvent("ticket-updated"));
      }
    } catch (e: any) {
      alert(e?.message || "ارسال ناموفق بود");
    } finally {
      setSending(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    marginTop: 24,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#222",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#0b0b0b",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#000",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#333",
    borderRadius: 10,
    padding: 8,
    color: "#fff",
    minHeight: 80,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  };

  const primaryBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };

  const secondaryBtn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#1f2933",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  };

  const infoText: React.CSSProperties = {
    fontSize: 11,
    opacity: 0.6,
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>ارسال پاسخ</div>
      <textarea
        style={textareaStyle}
        placeholder="متن پاسخ… (اختیاری وقتی فایل می‌فرستید)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={rowStyle}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="audio/*,image/*,.pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          style={{ fontSize: 11 }}
        />
        {file ? (
          <span style={{ fontSize: 11, color: "#34d399" }}>
            فایل انتخاب شد: {file.name}
          </span>
        ) : (
          <span style={infoText}>می‌توانید فایل/عکس/ویس ضمیمه کنید</span>
        )}
        {recSupported && (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            style={{
              ...secondaryBtn,
              backgroundColor: recording ? "#dc2626" : "#2563eb",
            }}
          >
            {recording ? "توقف ضبط" : "ضبط ویس"}
          </button>
        )}
      </div>
      <div style={{ ...rowStyle, marginTop: 12 }}>
        <button
          onClick={submit}
          disabled={sending || (!file && !text.trim())}
          style={{
            ...primaryBtn,
            opacity: sending || (!file && !text.trim()) ? 0.6 : 1,
          }}
        >
          {sending ? "در حال ارسال…" : "ارسال"}
        </button>
        {file && (
          <button
            type="button"
            onClick={() => setFile(null)}
            style={secondaryBtn}
          >
            حذف فایل
          </button>
        )}
      </div>
    </div>
  );
}