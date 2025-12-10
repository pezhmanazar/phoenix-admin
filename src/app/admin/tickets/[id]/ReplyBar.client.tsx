// src/app/admin/tickets/[id]/ReplyBar.client.tsx
"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export default function ReplyBar({ ticketId }: { ticketId?: string }) {
  const id =
    ticketId ||
    (typeof window !== "undefined"
      ? (window.location.pathname.split("/").pop() || "").trim()
      : "");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [recordBlobUrl, setRecordBlobUrl] = useState<string | null>(null);
  const [recordMime, setRecordMime] = useState<string>("");

  useEffect(() => {
    setRecordingSupported(
      typeof window !== "undefined" &&
        // @ts-ignore
        !!window.MediaRecorder
    );
    return () => {
      cleanupRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsPaused(false);
  };

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  const onPickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f || null);
  };

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
        setIsPaused(false);
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setFile(null);
        setRecordBlobUrl(url);
      };

      rec.start(200);
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (e: any) {
      alert("دسترسی به میکروفون ممکن نیست. " + (e?.message || ""));
      cleanupRecording();
    }
  };

  const pauseRecording = () => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state === "recording") {
      recorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state === "paused") {
      recorderRef.current.resume();
      setIsPaused(false);
      startTimer();
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

  // ---- styles ----
  const container: React.CSSProperties = {
    marginTop: 24,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#333",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#0a0a0a",
  };

  const label: React.CSSProperties = {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  };

  const textarea: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#000",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#333",
    borderRadius: 10,
    padding: 8,
    color: "#fff",
    fontSize: 13,
    minHeight: 90,
    outline: "none",
    boxSizing: "border-box",
  };

  const sectionBox: React.CSSProperties = {
    marginTop: 12,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#333",
    backgroundColor: "#0b0b0b",
  };

  const row: React.CSSProperties = {
    marginTop: 8,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  };

  const smallText: React.CSSProperties = {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  };

  const timerText: React.CSSProperties = {
    marginLeft: "auto",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontVariantNumeric: "tabular-nums",
  };

  const baseBtn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: "#fff",
  };

  const outlineBtn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#333",
    backgroundColor: "#111",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    fontSize: 12,
  };

  const primarySendBtn: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div style={container}>
      <div style={label}>ارسال پاسخ</div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="متن پاسخ…"
        style={textarea}
      />

      {/* ضبط ویس */}
      <div style={sectionBox}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ ...smallText, color: "rgba(255,255,255,0.7)" }}>
            ضبط ویس
          </span>
          <span style={timerText}>{formatTime(seconds)}</span>
        </div>

        <div style={row}>
          <button
            type="button"
            onClick={startRecording}
            disabled={!recordingSupported || isRecording || sending}
            style={{
              ...baseBtn,
              backgroundColor: "#e11d48",
              opacity:
                !recordingSupported || isRecording || sending ? 0.5 : 1,
            }}
          >
            شروع ضبط
          </button>
          <button
            type="button"
            onClick={pauseRecording}
            disabled={!isRecording || isPaused || sending}
            style={{
              ...baseBtn,
              backgroundColor: "#222",
              opacity: !isRecording || isPaused || sending ? 0.5 : 1,
            }}
          >
            مکث
          </button>
          <button
            type="button"
            onClick={resumeRecording}
            disabled={!isRecording || !isPaused || sending}
            style={{
              ...baseBtn,
              backgroundColor: "#222",
              opacity: !isRecording || !isPaused || sending ? 0.5 : 1,
            }}
          >
            ادامه
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording || sending}
            style={{
              ...baseBtn,
              backgroundColor: "#059669",
              opacity: !isRecording || sending ? 0.5 : 1,
            }}
          >
            پایان ضبط
          </button>
          <button
            type="button"
            onClick={cancelRecording}
            disabled={(!isRecording && !recordBlobUrl) || sending}
            style={{
              ...outlineBtn,
              opacity:
                (!isRecording && !recordBlobUrl) || sending ? 0.5 : 1,
            }}
          >
            لغو ضبط
          </button>
          {!recordingSupported && (
            <span
              style={{
                fontSize: 11,
                color: "#fbbf24",
              }}
            >
              مرورگر از MediaRecorder پشتیبانی نمی‌کند؛ فایل صوتی را آپلود
              کنید.
            </span>
          )}
        </div>

        {recordBlobUrl ? (
          <div style={{ marginTop: 8 }}>
            <audio controls src={recordBlobUrl} style={{ width: "100%" }} />
          </div>
        ) : null}
      </div>

      {/* انتخاب فایل */}
      <div style={row}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          hidden
        />
        <button
          type="button"
          onClick={onPickFile}
          style={outlineBtn}
        >
          انتخاب فایل / ویس / عکس
        </button>
        {file ? (
          <span style={smallText}>
            انتخاب شده: <b>{file.name}</b>
          </span>
        ) : (
          <span
            style={{ ...smallText, color: "rgba(255,255,255,0.4)" }}
          >
            فایلی انتخاب نشده
          </span>
        )}
      </div>

      {/* دکمه ارسال */}
      <div style={{ ...row, marginTop: 12 }}>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || (!text.trim() && !file && !recordBlobUrl)}
          style={{
            ...primarySendBtn,
            opacity:
              sending || (!text.trim() && !file && !recordBlobUrl) ? 0.6 : 1,
          }}
        >
          {sending ? "در حال ارسال…" : "ارسال"}
        </button>
        {file || recordBlobUrl ? (
          <button
            type="button"
            onClick={clearForm}
            disabled={sending}
            style={{
              ...outlineBtn,
              opacity: sending ? 0.6 : 1,
            }}
          >
            پاک‌سازی
          </button>
        ) : null}
      </div>
    </div>
  );
}