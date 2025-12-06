"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ⚠️ این کامپوننت همان قبلی است + قابلیت ضبط ویس.
// همچنان به API داخلی Next می‌فرستیم تا توکن HttpOnly سمت سرور خوانده شود.

export default function ReplyBar({ ticketId }: { ticketId?: string }) {
  // اگر ticketId از پرنت نیاد، از URL بخون (fallback)
  const id =
    ticketId ||
    (typeof window !== "undefined"
      ? (window.location.pathname.split("/").pop() || "").trim()
      : "");

  // متن/فایل
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
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [recordBlobUrl, setRecordBlobUrl] = useState<string | null>(null);
  const [recordMime, setRecordMime] = useState<string>("");

  useEffect(() => {
    setRecordingSupported(typeof window !== "undefined" && !!window.MediaRecorder);
    return () => {
      cleanupRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    // @ts-ignore
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
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
    // پاک‌سازی ویس ضبط‌شده
    if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    setRecordBlobUrl(null);
    setRecordMime("");
    setSeconds(0);
    cleanupRecording();
  };

  // ----- کنترل‌های ضبط -----
  const startRecording = async () => {
    if (!recordingSupported || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // سعی در انتخاب بهترین mime
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      } else {
        mimeType = ""; // بذار خود مرورگر انتخاب کنه
      }

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        // اگر قبلاً فایل انتخاب شده بود، پاکش کن (اولویت با ویس ضبطی)
        setFile(null);
        setRecordBlobUrl(url);
      };

      rec.start(200); // هر 200ms یک chunk
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
    // لغو و دور ریختن
    cleanupRecording();
    if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    setRecordBlobUrl(null);
    setRecordMime("");
    setSeconds(0);
  };

  const onSend = async () => {
    if (!id) return;

    // اولویت‌ها:
    // 1) اگر ویس ضبط‌شده داریم → همون رو بفرست
    // 2) اگر فایل انتخاب شده داریم → همون رو بفرست
    // 3) اگر فقط متن داریم → متنی بفرست

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
        // تبدیل Blob URL به File
        const blob = await fetch(recordBlobUrl as string).then((r) => r.blob());
        const mime = blob.type || recordMime || "audio/webm";
        const ext = mime.includes("ogg") ? "ogg" : "webm";
        const recordedFile = new File([blob], `voice.${ext}`, { type: mime });

        const fd = new FormData();
        fd.append("file", recordedFile);
        if (text.trim()) fd.append("text", text.trim());
        // مدت زمان ضبط‌شده
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
        // فقط متن
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

  return (
    <div className="mt-6 border border-[#333] rounded-xl p-3 bg-[#0a0a0a]">
      <div className="text-sm text-white/80 mb-2">ارسال پاسخ</div>

      {/* ورودی متن */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="متن پاسخ…"
        className="w-full bg-black border border-[#333] rounded-lg p-2 text-sm text-white min-h-[90px] outline-none"
      />

      {/* ضبط ویس */}
      <div className="mt-3 p-2 rounded-lg border border-[#333] bg-[#0b0b0b]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">ضبط ویس</span>
          <span className="ml-auto text-xs text-white/60 tabular-nums">{formatTime(seconds)}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={!recordingSupported || isRecording || sending}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
          >
            شروع ضبط
          </button>

          <button
            type="button"
            onClick={pauseRecording}
            disabled={!isRecording || isPaused || sending}
            className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] disabled:opacity-50"
          >
            مکث
          </button>

          <button
            type="button"
            onClick={resumeRecording}
            disabled={!isRecording || !isPaused || sending}
            className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] disabled:opacity-50"
          >
            ادامه
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording || sending}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            پایان ضبط
          </button>

          <button
            type="button"
            onClick={cancelRecording}
            disabled={(!isRecording && !recordBlobUrl) || sending}
            className="px-3 py-1.5 rounded-lg bg-[#111] border border-[#333] text-white/80 hover:bg-[#151515] disabled:opacity-50"
          >
            لغو ضبط
          </button>

          {!recordingSupported && (
            <span className="text-[11px] text-amber-400">
              مرورگر از MediaRecorder پشتیبانی نمی‌کند؛ فایل صوتی را آپلود کنید.
            </span>
          )}
        </div>

        {/* پیش‌نمایش ویس ضبط‌شده */}
        {recordBlobUrl ? (
          <div className="mt-3">
            <audio controls src={recordBlobUrl} className="w-full" />
          </div>
        ) : null}
      </div>

      {/* انتخاب فایل */}
      <div className="flex items-center gap-2 mt-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          hidden
          // accept="image/*,audio/*,.pdf,.doc,.docx,.zip"
        />
        <button
          type="button"
          onClick={onPickFile}
          className="px-3 py-1.5 rounded-lg bg-[#111] border border-[#333] text-white/90 hover:bg-[#151515]"
        >
          انتخاب فایل / ویس / عکس
        </button>
        {file ? (
          <span className="text-xs text-white/70">
            انتخاب شده: <b>{file.name}</b>
          </span>
        ) : (
          <span className="text-xs text-white/40">فایلی انتخاب نشده</span>
        )}
      </div>

      {/* دکمه ارسال */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={sending || (!text.trim() && !file && !recordBlobUrl)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {sending ? "در حال ارسال…" : "ارسال"}
        </button>
        {(file || recordBlobUrl) ? (
          <button
            type="button"
            onClick={clearForm}
            disabled={sending}
            className="px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-white/80 hover:bg-[#151515]"
          >
            پاک‌سازی
          </button>
        ) : null}
      </div>

      <div className="mt-2 text-[11px] text-white/40">
       
      </div>
    </div>
  );
}