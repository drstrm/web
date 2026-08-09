/*
 * 홈 배너 이미지 프록시
 * ------------------------------------------------------------------
 * GET /api/banner-image?p=<노션 page id>&i=<이미지 순번>&v=<버전 토큰>
 *
 * 서명 URL 을 감추는 이유 · 캐시 전략은 lib/notion-image.ts 주석 참고.
 */

import { serveNotionImage } from "@/lib/notion-image";
import { getBannerImageSource } from "@/lib/notion";

// 서명 URL 을 매 요청마다 새로 받아야 하므로 정적 최적화 대상에서 제외한다.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return serveNotionImage(req, {
    tag: "banner-image",
    resolve: getBannerImageSource,
  });
}
