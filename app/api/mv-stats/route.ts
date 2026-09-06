/*
 * 유튜브 MV 조회수 · 좋아요
 * ------------------------------------------------------------------
 * GET /api/mv-stats → MvLiveStats[]
 *
 * 홈(app/page.tsx)은 300초 ISR 이라 서버 렌더에 섞어 두면 최대 5분 묵은 숫자가
 * HTML 에 박힌다. "접속·새로고침마다 갱신"을 지키려고 카드가 뜨는 순간
 * components/MvCard.tsx 가 여기를 부른다.
 *
 * 영상 id 를 쿼리로 받지 않는 이유: 받는 순간 아무 유튜브 영상이나 대신 긁어
 * 주는 공개 프록시가 된다. 목록은 서버가 정한 getMvStats 것만 쓴다.
 */

import { getMvStats } from "@/lib/content";
import { fetchYoutubeStats } from "@/lib/youtube";
import type { MvLiveStats } from "@/lib/mv";

// 응답이 "지금 몇 회인가"에 달려 있다. 캐시되면 갱신하는 의미가 없다.
export const dynamic = "force-dynamic";

export async function GET() {
  // 영상이 여러 개여도 유튜브 왕복은 한 번에 병렬로 끝낸다.
  const stats: MvLiveStats[] = await Promise.all(
    getMvStats().map(async (mv) => ({
      youtubeId: mv.youtubeId,
      // 조회에 실패하면 빈 값 — 화면은 서버가 준 "—" 를 그대로 둔다.
      ...(await fetchYoutubeStats(mv.youtubeId)),
    })),
  );

  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}
