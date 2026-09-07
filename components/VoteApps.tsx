"use client";

import { ChevronRight, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, EmptyState, IconTile } from "@/components/ui";
import { VOTE_APPS, type VoteAppSlot } from "@/lib/oneclick";
import { fetchActiveVotes, formatVotePeriod, type ActiveVote } from "@/lib/votes";
import { cn } from "@/lib/utils";

/**
 * 앱 투표 원클릭
 * ------------------------------------------------------------------
 * **카드 한 장 = 투표 한 건.** 한 플랫폼에 투표가 두 건 이상 열려도 카드가
 * 그만큼 늘어날 뿐이라, 「카드 = 링크 하나」라는 규칙이 그대로 유지된다.
 * (카드 하나에 링크를 여러 개 넣으면 어디를 눌러야 하는지가 모호해진다.)
 *
 * 화면은 두 칸으로 못 박혀 있다.
 * · 위 「진행중 투표」  — 열려 있는 투표만, 마감 임박 순. 없으면 안내 문구.
 * · 아래 「앱 바로가기」 — 앱 여섯 개 **항상 전부**, 앱 홈으로 가는 고정 링크.
 *
 * 아래 칸이 투표 유무와 무관하게 고정이라, 투표 목록이 도착해도 움직이는 것은
 * 위 칸뿐이다 — 버튼이 자리를 옮겨 다니지 않는다.
 * 같은 아이콘이 두 장 나와도 제목 · 기간이 달라 서로 다른 투표임이 드러난다.
 * 갱신은 1분마다 /api/votes 로 한다(lib/votes.ts).
 */

const KEYS = VOTE_APPS.map((app) => app.key);
const APP_BY_KEY = new Map(VOTE_APPS.map((app) => [app.key, app]));

export default function VoteApps() {
  const [votes, setVotes] = useState<ActiveVote[]>([]);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const data = await fetchActiveVotes(KEYS);
        if (alive) setVotes(data);
      } catch (e) {
        console.error(e); // 조회 실패 시 위 칸은 비고, 아래 앱 바로가기는 그대로다
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
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-muted">
          {votes.length > 0 && (
            <span aria-hidden className="pulse-dot size-1.5 shrink-0 rounded-full bg-champagne-500" />
          )}
          진행중 투표
          {votes.length > 0 && <span className="text-champagne-800">{votes.length}건</span>}
        </p>

        {votes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {votes.map((vote) => (
              <VoteCard key={vote.id} vote={vote} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Vote}
            title="지금 진행중인 투표가 없습니다"
            description="투표가 열리면 여기에 바로가기 버튼이 나옵니다."
          />
        )}
      </div>

      <div>
        <p className="mb-2.5 text-[11px] font-bold tracking-wide text-muted">앱 바로가기</p>
        {/* 투표가 열려 있든 아니든 여섯 개 그대로. 이 칸은 움직이지 않는다 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {VOTE_APPS.map((app) => (
            <AppTile key={app.key} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 진행중 투표 한 건. 카드 전체가 투표 URL 로 가는 링크다 */
function VoteCard({ vote }: { vote: ActiveVote }) {
  const app = APP_BY_KEY.get(vote.iconType);

  return (
    <SmartLink
      href={vote.url}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-champagne-300 bg-champagne-50/50 p-4 shadow-card transition-all",
        "hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]",
      )}
    >
      {/* vote.iconType = 노션 `플랫폼` 값 = public/icons 파일명 */}
      <IconTile tone="accent-soft" size="lg">
        <PlatformIcon iconType={vote.iconType} size={48} />
      </IconTile>

      <div className="min-w-0 flex-1">
        {/* 같은 앱에 두 건이 열리면 아이콘이 같다 — 제목이 둘을 가르므로 두 줄까지 살린다 */}
        <p className="line-clamp-2 font-bold leading-snug">{vote.title}</p>
        {app && <p className="mt-0.5 truncate text-xs text-muted">{app.name}</p>}
        <p className="mt-0.5 truncate text-[11px] font-semibold text-champagne-800">
          {formatVotePeriod(vote)}
        </p>
      </div>

      <Badge variant="accent" size="lg" className="shrink-0">
        투표하기
        <ChevronRight strokeWidth={2.6} />
      </Badge>
    </SmartLink>
  );
}

/**
 * 앱 바로가기 타일. 진행중 투표가 있어도 **앱 홈**으로 보낸다 —
 * 투표로 가는 길은 위 카드가 맡고, 이 칸은 하트 적립 · 예열용 고정 통로다.
 */
function AppTile({ app }: { app: VoteAppSlot }) {
  return (
    <SmartLink
      href={app.href}
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-surface p-3 shadow-card transition-all",
        "hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift active:scale-[0.98]",
      )}
    >
      <IconTile tone="sky" size="md">
        <PlatformIcon iconType={app.key} size={40} />
      </IconTile>
      <span className="mt-2 w-full truncate text-center text-xs font-bold">{app.name}</span>
      <span className="w-full truncate text-center text-[11px] text-muted">{app.show}</span>
    </SmartLink>
  );
}
