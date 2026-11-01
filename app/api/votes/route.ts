/*
 * 진행중 투표 조회
 * ------------------------------------------------------------------
 * GET /api/votes?locale=en  → ActiveVote[] (지금 열려 있는 투표, 마감 빠른 순)
 *
 * 투표 앱 버튼(components/VoteApps.tsx)이 1분마다 이 주소를 다시 부른다.
 * 브라우저에서 노션을 직접 부를 수 없어서 — 토큰이 서버 전용이다 — 여기를 둔다.
 *
 * 노션 조회 자체는 60초 캐시라(lib/notion.ts 의 getSchedules), 이 라우트가 자주
 * 불려도 노션으로 나가는 요청은 분당 한 번이다.
 *
 * 언어를 쿼리로 받는다. `/api/**` 는 proxy.ts 의 matcher 에서 제외돼 있어 주소에
 * 로케일 접두어가 없고(그래야 <Image> 의 src 가 안 깨진다), 그래서 서버가 이
 * 요청의 언어를 스스로 알 길이 없다. 보내지 않으면 한국어다.
 */

import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getActiveVotes } from "@/lib/content";

// 응답이 "지금 몇 시인가"에 달려 있다. 캐시되면 이미 끝난 투표가 열린 채로 남는다.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 모르는 값은 무시한다 — 쿼리로 들어오는 값이라 그대로 믿지 않는다
  const requested = new URL(req.url).searchParams.get("locale");
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // 조회에 실패하면 lib/content.ts 가 빈 배열을 준다 — 화면은 기본 링크로 폴백한다.
  return Response.json(await getActiveVotes(locale), {
    headers: { "Cache-Control": "no-store" },
  });
}
