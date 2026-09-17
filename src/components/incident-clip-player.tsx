"use client";

import { useRef, useState } from "react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function IncidentClipPlayer({
  mediaUrl,
  mediaKind,
  startMs,
  endMs,
}: {
  mediaUrl: string;
  mediaKind: "video" | "audio";
  startMs: number;
  endMs: number;
}) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [fullRecording, setFullRecording] = useState(false);
  const startSec = startMs / 1000;
  const endSec = endMs / 1000;

  function playClip() {
    const el = ref.current;
    if (!el) return;
    setFullRecording(false);
    el.currentTime = startSec;
    el.play();
  }

  function handleLoadedMetadata() {
    if (!fullRecording) {
      const el = ref.current;
      if (el) el.currentTime = startSec;
    }
  }

  function handleTimeUpdate() {
    const el = ref.current;
    if (!el || fullRecording) return;
    if (el.currentTime >= endSec) el.pause();
  }

  const commonProps = {
    ref,
    controls: true,
    src: mediaUrl,
    onLoadedMetadata: handleLoadedMetadata,
    onTimeUpdate: handleTimeUpdate,
  };

  return (
    <div className="space-y-2">
      {mediaKind === "video" ? (
        <video {...commonProps} className="w-full rounded-lg" />
      ) : (
        <audio {...commonProps} className="w-full" />
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <button type="button" className="btn-secondary" onClick={playClip}>
          ▶ Reproduzir trecho ({formatTime(startSec)}–{formatTime(endSec)})
        </button>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={fullRecording}
            onChange={(e) => setFullRecording(e.target.checked)}
          />
          Ouvir/assistir gravação completa
        </label>
      </div>
    </div>
  );
}
