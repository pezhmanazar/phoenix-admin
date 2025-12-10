// src/app/admin/tickets/[id]/VoicePlayer.client.tsx
"use client";

import { useRef, useState } from "react";

export default function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState(1);

  const toggleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
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

      <audio
        ref={audioRef}
        controls
        src={src}
        onPlay={() => {
          if (audioRef.current) {
            audioRef.current.playbackRate = rate;
          }
        }}
        style={{
          flex: 1,
          outline: "none",
        }}
      />
    </div>
  );
}