// src/app/admin/tickets/[id]/VoicePlayer.client.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  useEffect(() => {
    setIsReady(false);
    setIsLoading(false);
  }, [src]);

  const handleFirstPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!isReady) {
        setIsLoading(true);
        audio.src = src;
        audio.load();
        setIsReady(true);
      }

      await audio.play();
      audio.playbackRate = rate;
    } catch (err) {
      console.log("ADMIN_AUDIO_PLAY_ERROR", { src, err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "6px 8px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={toggleRate}
        title="تغییر سرعت پخش"
        style={{
          fontSize: "11px",
          fontWeight: 700,
          padding: "4px 8px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.3)",
          backgroundColor: "rgba(0,0,0,0.45)",
          color: "#fff",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        ×{rate}
      </button>

      {!isReady ? (
        <button
          type="button"
          onClick={handleFirstPlay}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            height: 36,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            backgroundColor: "rgba(0,0,0,0.35)",
            color: "#fff",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "در حال بارگذاری ویس..." : "▶ پخش ویس"}
        </button>
      ) : (
        <audio
          ref={audioRef}
          controls
          preload="none"
          onPlay={() => {
            if (audioRef.current) {
              audioRef.current.playbackRate = rate;
            }
          }}
          onError={() => {
            console.log("ADMIN_AUDIO_ERROR", { src });
          }}
          style={{
            flex: 1,
            outline: "none",
          }}
        />
      )}

      {!isReady && (
        <audio
          ref={audioRef}
          preload="none"
          style={{ display: "none" }}
          onError={() => {
            console.log("ADMIN_AUDIO_ERROR", { src });
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
