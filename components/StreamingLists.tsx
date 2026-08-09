"use client";

import { useState } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import type { StreamingList } from "@/lib/content";
import { OS_EMOJI } from "@/lib/oneclick";

/**
 * 스밍리스트 원클릭 (플랫폼 > 운영체제 > 링크)
 * ------------------------------------------------------------------
 * 같은 플랫폼도 기기마다 링크가 달라서, 플랫폼 카드를 펼치면 OS별 링크가 나온다.
 * 목록 · 순서는 전부 노션 DB 에서 온다 (docs/notion-streaming-db.md).
 *
 * 모바일에서 플랫폼이 한 화면에 다 보이도록 기본은 접힌 상태로 두고,
 * 첫 번째 플랫폼만 펼쳐 둬서 바로 누를 수 있게 한다.
 */
export default function StreamingLists({ lists }: { lists: StreamingList[] }) {
  const [open, setOpen] = useState<string | null>(lists[0]?.platform ?? null);

  if (lists.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-surface px-6 py-10 text-center text-sm text-muted">
        스밍리스트가 아직 등록되지 않았습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lists.map((s) => {
        const expanded = open === s.platform;
        const panelId = `streaming-${s.iconType ?? encodeURIComponent(s.platform)}`;

        return (
          <div key={s.platform} className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : s.platform)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-sky-50 text-xl">
                <PlatformIcon iconType={s.iconType} size={44} fallback="🎵" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{s.platform}</span>
                <span className="block truncate text-xs text-muted">
                  {s.targets.flatMap((t) => t.os).join(" · ")}
                </span>
              </span>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={`ml-auto h-5 w-5 shrink-0 text-sky-500 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M5 8l5 5 5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {expanded && (
              <div id={panelId} className="space-y-4 border-t bg-background px-4 py-4">
                {s.targets.map((t) => (
                  <div key={t.os.join("-")}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted">
                      <span aria-hidden="true">
                        {t.os.map((os) => OS_EMOJI[os] ?? "").join("")}
                      </span>
                      {t.os.join(" · ")}
                    </p>

                    {t.links.length === 1 ? (
                      <SmartLink
                        href={t.links[0]}
                        className="flex w-full items-center justify-center gap-2 rounded-xl sky-gradient px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
                      >
                        원클릭 스밍 바로가기 ▶
                      </SmartLink>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {t.links.map((href, i) => (
                          <SmartLink
                            key={href}
                            href={href}
                            className="flex items-center justify-center gap-1.5 rounded-xl sky-gradient px-3 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
                          >
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[11px]">
                              {i + 1}
                            </span>
                            리스트
                          </SmartLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
