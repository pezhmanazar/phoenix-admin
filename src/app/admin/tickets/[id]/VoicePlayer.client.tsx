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
    <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 w-full">
      <button
        onClick={toggleRate}
        className="text-xs font-bold bg-black/30 px-2 py-1 rounded-md border border-white/20 hover:bg-black/50 transition"
        title="تغییر سرعت پخش"
      >
        ×{rate}
      </button>

      <audio
        ref={audioRef}
        controls
        src={src}
        className="flex-1"
        onPlay={() => {
          if (audioRef.current) audioRef.current.playbackRate = rate;
        }}
      />
    </div>
  );
}