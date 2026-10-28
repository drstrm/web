/*
 * 요청 하나에 쓸 언어 · 메시지 결정
 * ------------------------------------------------------------------
 * 미들웨어가 고른 `[locale]` 세그먼트를 받아, 그 언어의 messages/*.json 을 싣는다.
 * 서버 컴포넌트의 getTranslations() · 클라이언트의 useTranslations() 가 모두
 * 여기서 실린 메시지를 본다.
 *
 * ⚠ requestLocale 은 next-intl 4.14 기준 deprecated 다 (후속은 Next 16 의
 *   `next/root-params`). 그쪽은 아직 experimental.rootParams 플래그가 필요해서
 *   안정 경로를 쓴다. 플래그 없이 쓸 수 있게 되면 **이 파일만** 고치면 된다.
 */

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * 번역이 없는 키를 한국어 원문으로 메운다.
 *
 * 번역은 단계적으로 채워진다 — 새 문구를 코드에 넣은 직후에는 한국어만 있고,
 * scripts/i18n-sync.mjs 가 돌기 전까지 다른 언어에는 그 키가 없다. 그때
 * next-intl 의 기본 동작은 **키 이름을 화면에 그대로 찍는 것**이라
 * (`notice.cardTitle` 이 제목 자리에 나온다) 쓸 수 없다.
 *
 * 한국어로 보이는 것은 「아직 번역되지 않았다」는 정직한 상태이고, 깨진 화면이
 * 아니다. 노션 콘텐츠에도 같은 규칙을 쓴다 (lib/notion.ts 의 localized()).
 */
async function loadMessages(locale: string) {
  const source = (await import(`../messages/${routing.defaultLocale}.json`)).default;
  if (locale === routing.defaultLocale) return source;

  const translated = (await import(`../messages/${locale}.json`)).default;
  return deepMerge(source, translated);
}

/** 번역본의 값이 이긴다. 번역본에 없는 가지는 한국어가 그대로 남는다 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) &&
      current && typeof current === "object" && !Array.isArray(current)
        ? deepMerge(
            current as Record<string, unknown>,
            value as Record<string, unknown>,
          )
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  /*
   * `[locale]` 은 사실상 캐치올이라 `/unknown.txt` 같은 요청에도 값이 들어온다.
   * 모르는 값이면 한국어로 떨어뜨린다 — 여기서 throw 하면 그 주소가 500 이 된다.
   */
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    /*
     * 날짜 · 시각은 전부 한국 기준으로 보여준다. 해외 팬이 보는 투표 마감도
     * 「한국 시간 23:59」여야 의미가 있다 (lib/datetime.ts 와 같은 전제).
     */
    timeZone: "Asia/Seoul",
  };
});
