"use client";

import { useEffect, useState } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import { VOTE_APPS } from "@/lib/oneclick";
import { fetchActiveVotes, formatVotePeriod, type ActiveVote } from "@/lib/votes";

/**
 * 앱 투표 원클릭
 * 버튼은 항상 모두 노출. Supabase에 진행중 투표가 있으면 그 URL로,
 * 없으면 대기중(흐린) 디자인 그대로 기본 링크(VOTE_APPS.href)로 연결한다.
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
            className="flex items-center justify-between rounded-2xl border bg-surface p-4 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* app.key = schedules.icon_type = public/icons 파일명 */}
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-sky-50">
                <PlatformIcon iconType={app.key} size={40} />
              </span>
              <div className="min-w-0">
                <p className="font-bold">{app.name}</p>
                <p className="truncate text-xs text-muted">
                  {vote ? vote.title : app.show}
                </p>
                {vote && (
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {formatVotePeriod(vote)}
                  </p>
                )}
              </div>
            </div>
            <span
              className={
                active
                  ? "ml-3 shrink-0 rounded-full accent-gradient px-3 py-1.5 text-xs font-bold text-[#5a4a1f]"
                  : "ml-3 shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-muted"
              }
            >
              {active ? "투표하기" : "진행중 투표 없음"}
            </span>
          </SmartLink>
        );
      })}
    </div>
  );
}
