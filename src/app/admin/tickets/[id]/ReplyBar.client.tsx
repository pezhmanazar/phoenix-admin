// src/app/admin/tickets/[id]/ReplyBar.client.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export default function ReplyBar({ ticketId }: { ticketId?: string }) {
  // --- ticket id ---
  const id =
    ticketId ||
    (typeof window !== "undefined"
      ? (window.location.pathname.split("/").pop() || "").trim()
      : "");

  // --- state متن و فایل ---
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- ضبط ویس ---
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [recordBlobUrl, setRecordBlobUrl] = useState<string | null>(null);
  const [recordMime, setRecordMime] = useState<string>("");

  // --- برای auto-resize textarea ---
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setRecordingSupported(
      typeof window !== "undefined" &&
        // @ts-ignore
        !!window.MediaRecorder
    );
    return () => {
      cleanupRecording();
      if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // هر بار متن عوض شد، ارتفاع تکست‌اِریا را تنظیم کن
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 120; // حداکثر ارتفاع
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, [text]);

  // --- تایمر ضبط ---
  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    // @ts-ignore
    timerRef.current = window.setInterval(
      () => setSeconds((s) => s + 1),
      1000
    );
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // --- تمیز کردن ضبط ---
  const cleanupRecording = () => {
    try {
      stopTimer();
      recorderRef.current?.stop?.();
    } catch {}
    recorderRef.current = null;
    chunksRef.current = [];
    mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
  };

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  // --- فایل ضمیمه ---
  const onPickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f || null);
  };

  // --- پاک کردن فرم ---
  const clearForm = () => {
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    setRecordBlobUrl(null);
    setRecordMime("");
    setSeconds(0);
    cleanupRecording();
  };

  // --- شروع ضبط (با میکروفن) ---
  const startRecording = async () => {
    if (!recordingSupported || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      const rec = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      recorderRef.current = rec;
      setRecordMime(mimeType || rec.mimeType || "audio/webm");
      chunksRef.current = [];

      rec.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stopTimer();
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setFile(null);
        setRecordBlobUrl(url);
      };

      rec.start(200);
      setIsRecording(true);
      startTimer();
    } catch (e: any) {
      alert("دسترسی به میکروفون ممکن نیست. " + (e?.message || ""));
      cleanupRecording();
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    try {
      recorderRef.current.stop();
    } catch {}
    mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  const cancelRecording = () => {
    cleanupRecording();
    if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    setRecordBlobUrl(null);
    setRecordMime("");
    setSeconds(0);
  };

  // --- کلیک روی آیکن میکروفن: شروع/توقف ---
  const onMicClick = () => {
    if (!recordingSupported) {
      alert(
        "مرورگر از ضبط صدا پشتیبانی نمی‌کند. لطفاً فایل صوتی را به‌صورت فایل آپلود کنید."
      );
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // --- ارسال ---
  const onSend = async () => {
    if (!id) return;

    const hasRecorded = !!recordBlobUrl;
    const onlyText = !!text.trim() && !file && !hasRecorded;
    const hasFile = !!file;

    if (!onlyText && !hasFile && !hasRecorded) {
      alert("لطفاً متن وارد کنید یا فایل/ویس انتخاب/ضبط کنید.");
      return;
    }

    try {
      setSending(true);
      if (hasRecorded) {
        const blob = await fetch(recordBlobUrl as string).then((r) => r.blob());
        const mime = blob.type || recordMime || "audio/webm";
        const ext = mime.includes("ogg") ? "ogg" : "webm";
        const recordedFile = new File([blob], `voice.${ext}`, { type: mime });
        const fd = new FormData();
        fd.append("file", recordedFile);
        if (text.trim()) fd.append("text", text.trim());
        fd.append("durationSec", String(seconds || 0));
        const res = await fetch(`/api/admin/tickets/${id}/reply-upload`, {
          method: "POST",
          body: fd,
        });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "ارسال ویس ناموفق بود");
        }
      } else if (hasFile) {
        const fd = new FormData();
        fd.append("file", file as File);
        if (text.trim()) fd.append("text", text.trim());
        const res = await fetch(`/api/admin/tickets/${id}/reply-upload`, {
          method: "POST",
          body: fd,
        });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "ارسال فایل ناموفق بود");
        }
      } else {
        const res = await fetch(`/api/admin/tickets/${id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "ارسال پیام ناموفق بود");
        }
      }

      clearForm();
      if (typeof window !== "undefined") window.location.reload();
    } catch (e: any) {
      alert(e?.message || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  // ---------- استایل‌ها (فوتر جمع‌وجور و مرتب) ----------
  const container: React.CSSProperties = {
    borderTop: "1px solid #27272a",
    padding: "8px 10px 10px",
    backgroundColor: "#050505",
  };

  const mainRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center", // همه وسط عمودی
    gap: 8,
  };

  // آیکن‌ها کمی بزرگ‌تر تا هم‌قد با حباب
  const iconBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "999px",
    border: "1px solid #3f3f46",
    backgroundColor: "#09090b",
    color: "#e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
  };

  const sendBtn: React.CSSProperties = {
    ...iconBtn,
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,1))",
    border: "none",
    fontSize: 16,
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    resize: "none",
    backgroundColor: "#000",
    borderRadius: 999,
    border: "1px solid #3f3f46",
    padding: "8px 14px",           // padding متقارن بالا و پایین
    minHeight: 40,                 // هم‌قد آیکن‌ها
    color: "#f9fafb",
    fontSize: 13,
    lineHeight: 1.5,
    maxHeight: 120,
    outline: "none",
    boxSizing: "border-box",
    direction: "rtl",
    textAlign: "right",
  };

  const infoRow: React.CSSProperties = {
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "rgba(229,231,235,0.7)",
  };

  return (
    <div style={container}>
      {/* ردیف اصلی: سنجاق (چپ) + متن + میکروفن + ارسال (راست) */}
      <div style={mainRow}>
        {/* input واقعی فایل – مخفی */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {/* سنجاق */}
        <button
          type="button"
          onClick={onPickFile}
          style={iconBtn}
          title="ضمیمه فایل / تصویر / ویس"
          disabled={sending}
        >
          📎
        </button>

        {/* متن پاسخ – auto-resize */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نوشتن پاسخ…"
          style={textareaStyle}
          rows={1}
        />

        {/* میکروفن */}
        <button
          type="button"
          onClick={onMicClick}
          style={{
            ...iconBtn,
            backgroundColor: isRecording ? "#b91c1c" : "#09090b",
            borderColor: isRecording ? "#f87171" : "#3f3f46",
          }}
          title={
            !recordingSupported
              ? "مرورگر از ضبط صدا پشتیبانی نمی‌کند"
              : isRecording
              ? "پایان ضبط"
              : "شروع ضبط ویس"
          }
          disabled={sending}
        >
          🎤
        </button>

        {/* ارسال – فلش به سمت چپ */}
        <button
          type="button"
          onClick={onSend}
          style={sendBtn}
          disabled={sending || (!text.trim() && !file && !recordBlobUrl)}
          title="ارسال"
        >
          ◀
        </button>
      </div>

      {/* ردیف پایینی: تایمر، نام فایل، پاک‌سازی، پیش‌نمایش ویس */}
      <div style={infoRow}>
        {isRecording ? (
          <span style={{ color: "#f97373" }}>
            در حال ضبط… {formatTime(seconds)}
          </span>
        ) : recordBlobUrl ? (
          <span>ویس آماده ارسال – {formatTime(seconds)}</span>
        ) : null}

        {file ? (
          <span>
            فایل انتخاب‌شده: <strong>{file.name}</strong>
          </span>
        ) : null}

        {(file || recordBlobUrl) && (
          <button
            type="button"
            onClick={clearForm}
            disabled={sending}
            style={{
              marginRight: "auto",
              border: "none",
              background: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 11,
              textDecoration: "underline",
            }}
          >
            پاک‌سازی
          </button>
        )}
      </div>

      {recordBlobUrl && (
        <div style={{ marginTop: 4 }}>
          <audio controls src={recordBlobUrl} style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}