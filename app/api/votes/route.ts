/*
 * 진행중 투표 조회
 * ------------------------------------------------------------------
 * GET /api/votes  → ActiveVote[] (지금 열려 있는 투표, 마감 빠른 순)
 *
 * 투표 앱 버튼(components/VoteApps.tsx)이 1분마다 이 주소를 다시 부른다.
 * 브라우저에서 노션을 직접 부를 수 없어서 — 토큰이 서버 전용이다 — 여기를 둔다.
 *
 * 노션 조회 자체는 60초 캐시라(lib/notion.ts 의 getSchedules), 이 라우트가 자주
 * 불려도 노션으로 나가는 요청은 분당 한 번이다.
 */

import { getActiveVotes } from "@/lib/content";

// 응답이 "지금 몇 시인가"에 달려 있다. 캐시되면 이미 끝난 투표가 열린 채로 남는다.
export const dynamic = "force-dynamic";

export async function GET() {
  // 조회에 실패하면 lib/content.ts 가 빈 배열을 준다 — 화면은 기본 링크로 폴백한다.
  return Response.json(await getActiveVotes(), {
    headers: { "Cache-Control": "no-store" },
  });
}
