"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, IconTile } from "@/components/ui";
import { VOTE_APPS } from "@/lib/oneclick";
import { fetchActiveVotes, formatVotePeriod, type ActiveVote } from "@/lib/votes";
import { cn } from "@/lib/utils";

/**
 * 앱 투표 원클릭
 * 버튼은 항상 모두 노출. 노션 일정 DB 에 진행중 투표가 있으면 그 URL로,
 * 없으면 대기중(흐린) 디자인 그대로 기본 링크(VOTE_APPS.href)로 연결한다.
 * 목록은 /api/votes 에서 1분마다 새로 받는다 (lib/votes.ts).
 *
 * 진행중인 투표는 포인트 컬러(샴페인)로 테두리까지 물들여, 카드 여섯 장 중
 * 「지금 눌러야 하는 것」이 스크롤 없이도 바로 눈에 띄게 한다.
 */
export default function VoteApps() {
  const [votes, setVotes] = useState<Record<string, ActiveVote>>({});

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const data = await fetchActiveVotes(VOTE_APPS.map((a) => a.key));
        if (alive) setVotes(data);
      } catch (e) {
        console.error(e); // 조회 실패 시 기본 링크로 폴백
      }
    };
    sync();
    const id = setInterval(sync, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {VOTE_APPS.map((app) => {
        const vote = votes[app.key];
        const active = Boolean(vote);
        const href = vote?.url ?? app.href;

        return (
          <SmartLink
            key={app.key}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-card transition-all",
              "hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]",
              active
                ? "border-champagne-300 bg-champagne-50/50"
                : "border-border hover:border-sky-200",
            )}
          >
            {/* app.key = 노션 `플랫폼` 값 = public/icons 파일명 */}
            <IconTile tone={active ? "accent-soft" : "sky"} size="lg">
              <PlatformIcon iconType={app.key} size={48} />
            </IconTile>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-bold">
                <span className="min-w-0 truncate">{app.name}</span>
                {active && (
                  <span
                    aria-hidden
                    className="pulse-dot size-1.5 shrink-0 rounded-full bg-champagne-500"
                  />
                )}
              </p>
              <p className="truncate text-xs text-muted">{vote ? vote.title : app.show}</p>
              {vote && (
                <p className="mt-0.5 truncate text-[11px] font-semibold text-champagne-800">
                  {formatVotePeriod(vote)}
                </p>
              )}
            </div>

            {active ? (
              <Badge variant="accent" size="lg" className="shrink-0">
                투표하기
                <ChevronRight strokeWidth={2.6} />
              </Badge>
            ) : (
              <Badge variant="outline" size="lg" className="shrink-0">
                대기 중
              </Badge>
            )}
          </SmartLink>
        );
      })}
    </div>
  );
}
