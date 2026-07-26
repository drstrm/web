/*
 * 진행중 투표 조회 (Supabase `daily_todos`)
 * icon_type 이 VOTE_APPS 의 key(fancast · mnetplus · mubeat · linc · higher)와 1:1 대응.
 * 투표 기간은 DB의 start_date / end_date(UTC)로만 판단하고 코드에는 두지 않는다.
 */

import { sbGet } from "@/lib/supabase";

export type ActiveVote = {
  id: number;
  title: string;
  url: string | null;
  description: string | null;
  guide_url: string | null;
  start_date: string;
  end_date: string;
  icon_type: string;
};

/**
 * 지금 시각 기준 진행중인 투표를 icon_type별로 반환.
 * 같은 앱에 여러 건이면 마감이 빠른 건을 우선한다.
 */
export async function fetchActiveVotes(keys: string[]): Promise<Record<string, ActiveVote>> {
  const nowISO = new Date().toISOString();
  const rows = await sbGet<ActiveVote[]>(
    `daily_todos?select=id,title,url,description,guide_url,start_date,end_date,icon_type` +
      `&icon_type=in.(${keys.join(",")})` +
      `&start_date=lte.${nowISO}&end_date=gt.${nowISO}&order=end_date,id`
  );

  const byKey: Record<string, ActiveVote> = {};
  for (const row of rows) {
    if (row.url && !byKey[row.icon_type]) byKey[row.icon_type] = row;
  }
  return byKey;
}

/** 투표 기간 표시용 (KST): "03.05 18:10 ~ 03.05 19:10" */
export function formatVotePeriod(vote: ActiveVote): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(new Date(iso))
      .replace(/\.\s/g, ".")
      .replace(/\.$/, "");
  return `${fmt(vote.start_date)} ~ ${fmt(vote.end_date)}`;
}
