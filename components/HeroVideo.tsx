"use client";

import { useRef, useState } from "react";
import { Play, MonitorPlay } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";

/* 언어별 영상 — 영문은 해외 기업 대상 '한국 진출 전 시장조사' 티저(나레이션 Ainsley, 37초).
   원본: ~/Desktop/업무/홍보/최종본/SocialTwin_EN_Korea_Market_Entry_Ainsley_v2.mp4 (+faststart 리먹스) */
const VIDEOS = {
  ko: { src: "/videos/service-intro.mp4", poster: "/videos/service-intro-poster.jpg" },
  en: { src: "/videos/teaser-en.mp4", poster: "/videos/teaser-en-poster.jpg" },
} as const;

/* 히어로 우측 — 서비스 소개 동영상 (클릭 시 재생) */
export default function HeroVideo() {
  const t = useT();
  const video = VIDEOS[useLang()];
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
          <span className="text-sm font-semibold text-white">{t("서비스 소개 영상", "Korea market entry teaser")}</span>
          <span className="ml-auto text-xs text-slate-400">{t("1분 51초", "0:37")}</span>
        </div>
        <div className="relative aspect-video bg-slate-900">
          {/* preload="none": 클릭 전에는 영상(한 54MB / 영 9MB)을 내려받지 않음.
              key — 재생 중 언어를 바꾸면 다른 영상으로 깨끗이 다시 붙인다 */}
          <video
            key={video.src}
            ref={videoRef}
            src={video.src}
            poster={video.poster}
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
              aria-label={t("서비스 소개 동영상 재생", "Play Korea market entry teaser")}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/35 hover:bg-slate-950/25 transition-colors cursor-pointer"
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/95 shadow-xl shadow-black/40 group-hover:scale-110 transition-transform">
                <Play size={26} className="text-indigo-600 ml-1" fill="currentColor" />
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-900/70 text-white text-xs font-semibold backdrop-blur-sm">
                {t("클릭하여 재생", "Click to play")}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
