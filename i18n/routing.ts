/*
 * 다국어 라우팅 설정
 * ------------------------------------------------------------------
 * 한국어는 **접두어 없이** 쓴다 (`/guide/streaming`). 영어만 접두어가 붙는다
 * (`/en/guide/streaming`). `localePrefix: "as-needed"` 가 그 규칙이다.
 *
 * ⚠ 이 선택을 바꾸지 말 것. 한국어에 `/ko` 를 붙이면 X · 위버스 · 다음카페 ·
 *   카톡에 이미 뿌려진 링크가 전부 리다이렉트를 타고, 노션 바로가기 DB 에
 *   운영진이 적어 둔 `#preorder` 같은 값도 같이 흔들린다.
 *
 * 언어를 추가하는 법 (코드 수정은 이 파일 한 줄 + 메시지 파일 하나)
 *   1) messages/<코드>.json 을 만든다 (scripts/i18n-sync.mjs 가 생성)
 *   2) 아래 locales 에 코드를 더한다
 *
 * 켜 둔 언어: ko · en · id(인도네시아) · th(태국) · ja(일본) · zh(중국)
 *
 * ⚠ 메시지 파일(messages/<코드>.json)이 없는 언어를 여기 적으면 그 경로가 깨진다.
 *   반대로 파일만 있고 여기 없으면 그 언어는 아무도 볼 수 없다 — 둘을 같이 고친다.
 *
 * 번역 품질을 의심할 언어가 생기면 이 배열에서 한 줄 빼면 즉시 내려간다
 * (파일은 남으므로 나중에 되돌리기 쉽다).
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en", "id", "th", "ja", "zh"],
  defaultLocale: "ko",
  /** 한국어는 접두어 없음 · 그 외는 `/<코드>` */
  localePrefix: "as-needed",
  /*
   * 브라우저 설정 언어(Accept-Language)로 첫 방문자의 언어를 고른다.
   * 접속 국가(x-vercel-ip-country)는 쓰지 않는다 — 한국에 사는 해외 팬과
   * 해외에 사는 한국 팬이 둘 다 흔해서, 국가 기준은 양쪽 다 틀린다.
   *
   * 판단 순서: URL 접두어 → NEXT_LOCALE 쿠키(사용자가 고른 값) → 브라우저 설정
   */
  localeDetection: true,
  /*
   * 검색엔진에 다른 언어판을 알리는 Link 헤더를 미들웨어가 붙인다.
   * 페이지별 <link rel="alternate"> 는 각 generateMetadata 의
   * alternates.languages 가 따로 넣는다 (둘 다 있는 게 맞다).
   */
  alternateLinks: true,
});

export type Locale = (typeof routing.locales)[number];
