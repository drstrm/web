/*
 * 진행중 투표 — 브라우저 쪽 조회
 * ------------------------------------------------------------------
 * 데이터는 노션 공용 일정 DB 에 있다(docs/notion-schedule-db.md).
 * 캘린더 · To Do 와 같은 DB 를 `노출 위치` 열로 나눠 쓰므로, 운영진은 투표 일정을
 * 한 번만 적으면 달력 · 할일 · 투표 버튼에 함께 나온다.
 *
 * 노션 토큰은 서버 전용이라 브라우저에서 노션을 직접 부를 수 없다.
 * app/api/votes 가 대신 물어보고(기간 판정도 거기서 한다), 여기서는 결과만 받는다.
 *
 * iconType 은 VOTE_APPS 의 key(coogoong · mnetplus …) 및 public/icons 파일명과 1:1 대응.
 */

import { formatKstPeriod } from "@/lib/datetime";

export interface ActiveVote {
  /** 노션 page id */
  id: string;
  title: string;
  url: string;
  /** public/icons/<key>.png 의 key (= VOTE_APPS 의 key) */
  iconType: string;
  startsAt: string;
  endsAt: string;
  /** 노션에 시각 없이 날짜만 적은 일정 — 기간 표시에서 시각을 뗀다 */
  allDay: boolean;
}

/**
 * 지금 진행중인 투표를 iconType 별로 반환.
 * 같은 앱에 여러 건이면 마감이 빠른 건을 우선한다(정렬은 서버가 해서 내려준다).
 */
export async function fetchActiveVotes(
  keys: string[],
): Promise<Record<string, ActiveVote>> {
  const res = await fetch("/api/votes", { cache: "no-store" });
  if (!res.ok) throw new Error(`votes ${res.status}`);
  const votes = (await res.json()) as ActiveVote[];

  const byKey: Record<string, ActiveVote> = {};
  for (const vote of votes) {
    if (keys.includes(vote.iconType) && !byKey[vote.iconType]) {
      byKey[vote.iconType] = vote;
    }
  }
  return byKey;
}

/** 투표 기간 표시용 (KST): "03.05 18:10 ~ 03.05 19:10" */
export const formatVotePeriod = (vote: ActiveVote) =>
  formatKstPeriod(vote.startsAt, vote.endsAt, vote.allDay);
