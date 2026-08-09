/*
 * 가이드 이미지 프록시
 * ------------------------------------------------------------------
 * GET /api/guide-image?p=<노션 page id>&i=<이미지 순번>&v=<버전 토큰>
 *
 * 서명 URL 을 감추는 이유 · 캐시 전략은 lib/notion-image.ts 주석 참고.
 */

import { serveNotionImage } from "@/lib/notion-image";
import { getGuideImageSource } from "@/lib/notion";

// 서명 URL 을 매 요청마다 새로 받아야 하므로 정적 최적화 대상에서 제외한다.
// (Cache-Control 로 CDN 캐시는 그대로 받는다 — 별개의 층이다)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return serveNotionImage(req, {
    tag: "guide-image",
    resolve: getGuideImageSource,
  });
}
