"use client";

import { Music4, Play } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  EmptyState,
  IconTile,
} from "@/components/ui";
import type { StreamingList } from "@/lib/content";
import { OS_ICON } from "@/lib/oneclick";

/**
 * 스밍리스트 원클릭 (플랫폼 > 운영체제 > 링크)
 * ------------------------------------------------------------------
 * 같은 플랫폼도 기기마다 링크가 달라서, 플랫폼 카드를 펼치면 OS별 링크가 나온다.
 * 목록 · 순서는 전부 노션 DB 에서 온다 (docs/notion-streaming-db.md).
 *
 * 모바일에서 플랫폼이 한 화면에 다 보이도록 기본은 접힌 상태로 두고,
 * 첫 번째 플랫폼만 펼쳐 둬서 바로 누를 수 있게 한다.
 *
 * 여닫기는 Radix Accordion 이 맡는다 — 방향키 이동 · aria 속성 · 높이 애니메이션이
 * 따라오므로 직접 useState 로 관리하지 않는다.
 */
export default function StreamingLists({ lists }: { lists: StreamingList[] }) {
  if (lists.length === 0) {
    return (
      <EmptyState
        icon={Music4}
        title="스밍리스트가 아직 등록되지 않았습니다"
        description="컴백에 맞춰 플랫폼별 원클릭 링크가 올라옵니다."
      />
    );
  }

  const key = (s: StreamingList) => s.iconType ?? s.platform;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={key(lists[0])}
      className="space-y-3"
    >
      {lists.map((s) => (
        <AccordionItem key={s.platform} value={key(s)}>
          <AccordionTrigger>
            <IconTile tone="sky" size="lg">
              <PlatformIcon iconType={s.iconType} size={48} fallback={<Music4 />} />
            </IconTile>
            <span className="min-w-0">
              <span className="block font-bold">{s.platform}</span>
              <span className="block truncate text-xs text-muted">
                {s.targets.flatMap((t) => t.os).join(" · ")}
              </span>
            </span>
          </AccordionTrigger>

          <AccordionContent className="space-y-4 px-4 py-4">
            {s.targets.map((t) => (
              <div key={t.os.join("-")}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted">
                  {t.os.map((os) => {
                    const Icon = OS_ICON[os];
                    return Icon ? (
                      <Icon key={os} className="size-3 shrink-0" strokeWidth={2.4} />
                    ) : null;
                  })}
                  {t.os.join(" · ")}
                </p>

                {t.links.length === 1 ? (
                  <Button asChild variant="primary" size="lg" block>
                    <SmartLink href={t.links[0]}>
                      <Play strokeWidth={2.6} />
                      원클릭 스밍 바로가기
                    </SmartLink>
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {t.links.map((href, i) => (
                      <Button key={href} asChild variant="primary" size="lg">
                        <SmartLink href={href}>
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/25 text-[11px] font-extrabold leading-none">
                            {i + 1}
                          </span>
                          리스트
                        </SmartLink>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
