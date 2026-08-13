"use client";

import { useRef, useState } from "react";
import { Play, MonitorPlay } from "lucide-react";

/* 히어로 우측 — 서비스 소개 동영상 (클릭 시 재생) */
export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <div className={`${playing ? "" : "animate-float"} relative w-full max-w-3xl mx-auto`}>
      <div className="relative z-10 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl shadow-black/60 bg-slate-900">
        {/* 타이틀 바 — 서비스 소개 영상 */}
        <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-indigo-600/30 to-violet-600/20 border-b border-white/10">
          <MonitorPlay size={16} className="text-indigo-300" />
          <span className="text-sm font-semibold text-white">서비스 소개 영상</span>
          <span className="ml-auto text-xs text-slate-400">1분 51초</span>
        </div>
        <div className="relative aspect-video bg-slate-900">
          {/* preload="none": 클릭 전에는 54MB 영상을 내려받지 않음 */}
          <video
            ref={videoRef}
            src="/videos/service-intro.mp4"
            poster="/videos/service-intro-poster.jpg"
            preload="none"
            controls={playing}
            playsInline
            onEnded={() => setPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!playing && (
            <button
              type="button"
              onClick={handlePlay}
              aria-label="서비스 소개 동영상 재생"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/35 hover:bg-slate-950/25 transition-colors cursor-pointer"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/95 shadow-xl shadow-black/40 group-hover:scale-110 transition-transform">
                <Play size={26} className="text-indigo-600 ml-1" fill="currentColor" />
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-900/70 text-white text-xs font-semibold backdrop-blur-sm">
                클릭하여 재생
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
