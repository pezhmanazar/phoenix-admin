"use client";
import React, { useEffect, useRef, useState } from "react";

export default function ReplyForm({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // ضبط ساده‌ی صدا در مرورگر (اختیاری)
  const [recSupported, setRecSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    setRecSupported(typeof window !== "undefined" && !!navigator.mediaDevices && !!window.MediaRecorder);
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
        const f = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setFile(f); // فایل ضبط‌شده آماده آپلود
        // استریم را ببند
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
        // حالت فایل/ویس/عکس
        const form = new FormData();
        form.append("file", file);
        if (text.trim()) form.append("text", text.trim());
        // اگر مدت زمان ویس را دارید (در موبایل/وب) می‌توانید durationSec هم اضافه کنید

        const r = await fetch(`/api/admin/tickets/${id}/reply-upload`, {
          method: "POST",
          body: form,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || "upload_failed");

        // ریست
        setText("");
        setFile(null);
        // رویداد برای رفرش صفحه/لیست پیام‌ها (ساده)
        document.dispatchEvent(new CustomEvent("ticket-updated"));
      } else {
        // حالت فقط متن
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

  return (
    <div className="mt-6 border border-[#222] rounded-xl p-3 bg-[#0b0b0b]">
      <div className="text-sm font-bold mb-2">ارسال پاسخ</div>

      <textarea
        className="w-full bg-black border border-[#333] rounded-lg p-2 text-white min-h-[80px]"
        placeholder="متن پاسخ… (اختیاری وقتی فایل می‌فرستید)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="audio/*,image/*,.pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          className="text-xs"
        />
        {file ? (
          <span className="text-xs text-emerald-400">فایل انتخاب شد: {file.name}</span>
        ) : (
          <span className="text-xs opacity-60">می‌توانید فایل/عکس/ویس ضمیمه کنید</span>
        )}

        {recSupported && (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`px-2 py-1 rounded ${recording ? "bg-red-600" : "bg-blue-600"} text-white text-xs`}
          >
            {recording ? "توقف ضبط" : "ضبط ویس"}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={sending || (!file && !text.trim())}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
        >
          {sending ? "در حال ارسال…" : "ارسال"}
        </button>
        {file && (
          <button
            type="button"
            onClick={() => setFile(null)}
            className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white"
          >
            حذف فایل
          </button>
        )}
      </div>
    </div>
  );
}