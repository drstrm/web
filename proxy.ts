/*
 * 언어 판별 · 리다이렉트 (Next 16 의 proxy 규약 — 옛 middleware.ts 자리다)
 * ------------------------------------------------------------------
 * 첫 방문자의 브라우저 설정 언어(Accept-Language)를 보고 알맞은 언어로 보낸다.
 * 규칙은 i18n/routing.ts 에 있고, 이 파일은 그걸 어느 경로에 적용할지와
 * 「지원하지 않는 언어로 들어온 사람」을 어디로 보낼지를 정한다.
 *
 * 한국어는 접두어가 없으므로 `/guide/streaming` 요청은 리다이렉트 없이
 * 내부적으로 `/ko/guide/streaming` 으로 **rewrite** 된다 (주소창은 그대로다).
 * 비한국어 브라우저는 `/en/guide/streaming` 으로 **307 리다이렉트** 된다.
 *
 * ⚠ 307(임시)이어야 한다. 301(영구)은 브라우저가 캐시해서, 나중에 언어를
 *   바꿔도 계속 같은 곳으로 가고 사용자가 캐시를 지울 때까지 안 풀린다.
 *   next-intl 이 307 을 쓴다 — 직접 구현하지 말 것.
 */

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleLocale = createMiddleware(routing);

/** 지원하지 않는 언어로 들어온 사람이 받을 언어 (기획: 한국 외 기본 영어) */
const FALLBACK_LOCALE = "en";

/**
 * 브라우저가 원하는 언어 중 **우리가 지원하는 것이 있는가.**
 *
 * `defaultLocale` 이 「접두어 없는 언어」와 「매칭 실패 시 폴백」을 겸하는 탓에,
 * next-intl 에만 맡기면 지원 목록에 없는 언어(베트남어 · 스페인어 …)가 전부
 * 한국어로 떨어진다. 그래서 **지원 언어가 하나도 안 걸릴 때만** 아래에서 영어로
 * 보내고, 하나라도 걸리면 next-intl 의 협상에 맡긴다 — 그래야 일본어 브라우저가
 * `/ja`, 중국어가 `/zh` 로 제대로 간다.
 *
 * 비교는 주 언어 부호(primary subtag)로만 한다. `zh-CN` · `zh-TW` 가 둘 다 `zh`,
 * `ja-JP` 가 `ja` 로 걸려야 하기 때문이다.
 *
 * ⚠ 헤더가 아예 없으면 지원하는 것으로 본다(= 한국어로 둔다). 검색엔진 크롤러가
 *   Accept-Language 없이 들어오는데, 이걸 영어로 보내면 **접두어 없는 한국어
 *   주소가 색인에서 밀린다** (기본 언어이자 주 사용자층이 한국어다).
 */
function hasSupportedLanguage(acceptLanguage: string | null): boolean {
  const header = (acceptLanguage ?? "").trim();
  if (!header) return true;

  return header.split(",").some((part) => {
    // "ja-JP;q=0.9" → "ja"
    const tag = part.split(";")[0].trim().toLowerCase();
    const primary = tag.split("-")[0];
    return routing.locales.some((locale) => locale.toLowerCase() === primary);
  });
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * 이미 언어가 정해진 요청은 그대로 next-intl 에 넘긴다.
   *   · 주소에 접두어가 있다 (`/en/...`)        — 공유된 링크의 언어가 최우선
   *   · NEXT_LOCALE 쿠키가 있다                 — 사용자가 스위치로 고른 값
   */
  const hasPrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  const hasChosen = request.cookies.has("NEXT_LOCALE");

  if (
    !hasPrefix &&
    !hasChosen &&
    !hasSupportedLanguage(request.headers.get("accept-language"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${FALLBACK_LOCALE}${pathname === "/" ? "" : pathname}`;
    // 307 — 영구가 아니다. 나중에 언어를 바꿀 수 있어야 한다
    return NextResponse.redirect(url, 307);
  }

  return handleLocale(request);
}

export const config = {
  /*
   * 언어를 붙이면 안 되는 경로를 뺀다.
   *   /api        이미지 프록시 · 투표 · 사연 생성 — 언어와 무관하고,
   *               여기에 접두어가 붙으면 <Image> 의 src 가 통째로 깨진다
   *   /_next      프레임워크 자산
   *   파일 요청    public/ 의 아이콘 · 가이드 이미지 · 로고 (확장자가 있는 것)
   */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
