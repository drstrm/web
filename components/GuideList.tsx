"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GuideImage, GuideSection } from "@/lib/content";

/**
 * 가이드 섹션 렌더러 + 이미지 라이트박스
 * 기획안 4 필수: "음원 가이드 이미지 클릭 시 원본 크기로 크게 보기/다운로드"
 */
export default function GuideList({ sections }: { sections: GuideSection[] }) {
  const [active, setActive] = useState<GuideImage | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close]);

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <span className="h-4 w-1.5 rounded-full sky-gradient" />
            {section.title}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <article
                key={item.slug}
                className="rounded-2xl border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{item.title}</h3>
                  {item.status === "coming-soon" && (
                    <span className="shrink-0 rounded-full accent-gradient px-2 py-0.5 text-[11px] font-bold text-[#5a4a1f]">
                      오픈 예정
                    </span>
                  )}
                </div>
                {item.summary && (
                  <p className="mt-1.5 text-xs text-muted">{item.summary}</p>
                )}

                {item.status === "coming-soon" ? (
                  <p className="mt-3 text-xs text-muted">오픈 예정입니다.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {item.images?.map((img) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => setActive(img)}
                        className="group relative aspect-[3/4] overflow-hidden rounded-xl border"
                        aria-label={`${img.alt} 크게 보기`}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 640px) 45vw, 220px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* 라이트박스 */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            className="relative max-h-[80vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.alt}
              width={1200}
              height={1600}
              className="mx-auto h-auto max-h-[80vh] w-auto rounded-2xl object-contain"
            />
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <a
              href={active.src}
              download
              className="rounded-full accent-gradient px-5 py-2 text-sm font-bold text-[#5a4a1f]"
            >
              ⬇ 이미지 다운로드
            </a>
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold text-white"
            >
              닫기 ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
