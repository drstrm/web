"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BANNERS } from "@/lib/site";

/**
 * 홈 슬라이드 배너 (기획안 4 필수: 헤더 슬라이더 + 링크 연동)
 * 현재는 텍스트/그라디언트 플레이스홀더. 운영 시 배너 이미지(Vercel Blob 등)로 교체.
 */
export default function BannerSlider() {
  const [i, setI] = useState(0);
  const n = BANNERS.length;

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div className="relative overflow-hidden rounded-3xl border shadow-sm">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {BANNERS.map((b) => {
          const inner = (
            <div
              className={`flex aspect-[16/9] w-full shrink-0 flex-col items-center justify-center gap-2 p-6 text-center sm:aspect-[21/9] ${
                b.tone === "sky" ? "sky-gradient text-white" : "accent-gradient text-[#5a4a1f]"
              }`}
            >
              <h2 className="text-xl font-extrabold sm:text-3xl">{b.title}</h2>
              {b.subtitle && <p className="text-sm font-semibold opacity-90 sm:text-base">{b.subtitle}</p>}
            </div>
          );
          return b.href ? (
            <Link key={b.id} href={b.href} className="w-full shrink-0">
              {inner}
            </Link>
          ) : (
            <div key={b.id} className="w-full shrink-0">
              {inner}
            </div>
          );
        })}
      </div>

      {/* 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((b, idx) => (
          <button
            key={b.id}
            type="button"
            aria-label={`${idx + 1}번 배너`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
