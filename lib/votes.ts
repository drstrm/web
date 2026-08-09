/*
 * 진행중 투표 조회 (Supabase 공용 `schedules` 테이블)
 * ------------------------------------------------------------------
 * 구 daily_todos 테이블을 schedules 로 통합했다(supabase/migrate_daily_todos.sql).
 *   daily_todos.start_date  → schedules.starts_at
 *   daily_todos.end_date    → schedules.ends_at
 *   투표 위젯 노출 여부      → schedules.surfaces 에 'vote' 포함
 *
 * icon_type 은 VOTE_APPS 의 key(fancast · mnetplus …) 및 public/icons 아이콘 파일명과 1:1 대응.
 * 투표 기간은 DB의 starts_at / ends_at(UTC)로만 판단하고 코드에는 두지 않는다.
 */

import { formatKstPeriod } from "@/lib/datetime";
import { sbGet } from "@/lib/supabase";
import { toHref } from "@/lib/url";

export type ActiveVote = {
  id: number;
  title: string;
  url: string | null;
  description: string | null;
  guide_url: string | null;
  starts_at: string;
  ends_at: string;
  icon_type: string;
};

/**
 * 지금 시각 기준 진행중인 투표를 icon_type별로 반환.
 * 같은 앱에 여러 건이면 마감이 빠른 건을 우선한다.
 */
export async function fetchActiveVotes(keys: string[]): Promise<Record<string, ActiveVote>> {
  const nowISO = new Date().toISOString();
  const rows = await sbGet<ActiveVote[]>(
    `schedules?select=id,title,url,description,guide_url,starts_at,ends_at,icon_type` +
      `&published=is.true&surfaces=cs.%7Bvote%7D` +
      `&icon_type=in.(${keys.join(",")})` +
      `&starts_at=lte.${nowISO}&ends_at=gt.${nowISO}&order=ends_at,id`
  );

  const byKey: Record<string, ActiveVote> = {};
  for (const row of rows) {
    // url 은 운영진이 손으로 적는 칸이라 보정해서 담는다 (lib/url.ts).
    // 보정해도 못 쓰는 값이면 투표가 열려 있어도 링크를 걸 수 없으므로 건너뛴다.
    const url = toHref(row.url);
    if (url && !byKey[row.icon_type]) {
      byKey[row.icon_type] = { ...row, url, guide_url: toHref(row.guide_url) };
    }
  }
  return byKey;
}

/** 투표 기간 표시용 (KST): "03.05 18:10 ~ 03.05 19:10" */
export function formatVotePeriod(vote: ActiveVote): string {
  return formatKstPeriod(vote.starts_at, vote.ends_at);
}
