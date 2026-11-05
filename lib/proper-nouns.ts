/*
 * 고유명사 표기 — 한국어판은 한국어, 그 외는 전부 영어
 * ------------------------------------------------------------------
 * 음원 플랫폼(멜론 · 지니 …) · 앨범 판매처(예스24 · 핫트랙스 …) · 투표 앱(뮤빗 ·
 * 쿠궁 …) · 음악방송(뮤직뱅크 · 인기가요 …) 의 이름이다.
 * 번역이 아니라 **같은 회사의 다른 표기**라서, 언어마다 다르게 둘 이유가 없다 —
 * 일본어판에도 「メロン」이 아니라 `Melon` 을 보여준다. 그래서 노션 `_EN` 열이나
 * messages/*.json 과 달리 **영어 한 벌만** 둔다.
 *
 * ⚠ 이 파일은 **화면에 찍는 글자만** 바꾼다. 매칭 키는 한국어 그대로다.
 *
 *     lib/platform-icons.ts 의 PLATFORM_ICONS  노션 `플랫폼` 값과 글자까지 같아야 한다
 *     lib/album.ts 의 ALBUM_SHOP_ICONS 키       노션 `판매처` 값
 *     lib/content.ts 의 getRealtimeChart()      iconType 과 짝인 값
 *
 *   그래서 호출을 **렌더 지점에서** 한다. 데이터 레이어가 한국어를 그대로 내보내고
 *   화면이 표기만 고르는 구조라, 아이콘 매칭이나 Accordion 키가 언어에 흔들리지 않는다.
 *
 * 같은 한국어가 자리에 따라 다른 회사인 경우가 있다 — `애플뮤직` 은 음원 플랫폼으로는
 * 애플의 Apple Music 이고 앨범 판매처로는 한국 음반 쇼핑몰(applemusic.co.kr)이다.
 * 그래서 부르는 쪽이 자리를 알려준다 (`properNoun(name, locale, "shop")`).
 *
 * 모르는 이름은 **그대로 내보낸다.** 노션에 새 판매처가 들어와도 화면이 깨지지 않고
 * 한국어로 보일 뿐이다 — 「아직 영어 표기를 안 정했다」는 정직한 상태다
 * (lib/notion.ts 의 localized() 가 번역 없는 칸을 한국어로 두는 것과 같은 규칙).
 */

import { nameKey } from "@/lib/album";

/**
 * 한국어 표기 → 영어 표기.
 *
 * 영어 표기는 **각 서비스가 자기 영문 사이트 · 앱스토어에 쓰는 이름**을 따른다
 * (docs/notion-ai-translate-prompt.md 의 「번역하지 말고 그대로 두는 이름」과 같은 목록).
 * 해외 팬이 앱스토어나 판매처에서 **검색해서 찾을 수 있는 글자**여야 한다.
 */
const ENGLISH_NAMES: Record<string, string> = {
  /* 음원 플랫폼 — 실시간 차트 · 스밍리스트 */
  멜론: "Melon",
  "멜론 TOP100": "Melon TOP100",
  "멜론 HOT100": "Melon HOT100",
  지니: "Genie",
  벅스: "Bugs",
  플로: "FLO",
  바이브: "VIBE",
  카카오뮤직: "KakaoMusic",
  스포티파이: "Spotify",

  /* 앨범 판매처 — 예약판매 (lib/album.ts 의 ALBUM_SHOP_ICONS 와 같은 목록) */
  예스24: "YES24",
  핫트랙스: "Hottracks",
  알라딘: "Aladin",
  뮤직코리아: "Music Korea",
  메이크스타: "Makestar",
  올엠디: "AllMD",
  비트로드: "Beatroad",
  에버라인: "Everline",
  사운드웨이브: "Soundwave",
  위드뮤: "withmuu",
  /*
   * 표기를 다듬는다. 노션에 적힌 값은 사람이 치는 것이라 흔들리는데
   * (`Weverse shop` · `weverse shop`), 영어판에서는 브랜드 표기로 맞춘다.
   * nameKey() 가 대소문자 · 공백을 털어서 찾으므로 어느 쪽으로 적혀도 걸린다.
   */
  "Weverse shop": "Weverse Shop",
  Ktown4U: "Ktown4U",
  "SMTOWN &STORE": "SMTOWN &STORE",

  /* 음원 플랫폼 쪽 `애플뮤직` 은 진짜 애플의 서비스다 (아래 SHOP_NAMES 와 다르다) */
  애플뮤직: "Apple Music",

  /*
   * 투표 앱 — 앱 투표 원클릭 (lib/oneclick.ts 의 VOTE_APPS · PLATFORM_ICONS 와 같은 목록)
   *
   * 표기는 각 앱이 **자기 앱스토어 · 영문 사이트에 쓰는 이름**이다 (`linc.fan` 의
   * 대문자 i 가 아닌 `LiNC`, `muniverse.io` 의 `MUniverse`). 해외 팬이 앱스토어에서
   * 검색해서 찾아야 하는 글자라, 발음을 옮기지 않고 그 표기를 그대로 쓴다.
   */
  쿠궁: "Coogoong",
  엠넷플러스: "Mnet Plus",
  뮤빗: "Mubeat",
  뮤니버스: "MUniverse",
  링크: "LiNC",
  하이어: "Higher",
  아이돌챔프: "Idol Champ",

  /*
   * 음악방송 — 앱 타일의 연동 방송 이름 · 문자 투표 (lib/oneclick.ts)
   *
   * 방송사가 자기 영문 표기를 갖고 있다 (KBS `Music Bank` · MBC `Show! Music Core` ·
   * SBS `Inkigayo` · Mnet `M Countdown`). 음역(`Eumak Jungsim`)이 아니라 그쪽을 쓴다 —
   * 해외 팬이 이미 그 이름으로 알고 있는 방송이다.
   *
   * `음악중심` 과 `쇼! 음악중심` 이 둘 다 있다. 앱 타일은 앞쪽, 문자 투표는 뒤쪽으로
   * 적혀 있고 nameKey() 가 느낌표만 털어서는 같은 키가 되지 않는다.
   */
  뮤직뱅크: "Music Bank",
  엠카운트다운: "M Countdown",
  음악중심: "Show! Music Core",
  "쇼! 음악중심": "Show! Music Core",
  인기가요: "Inkigayo",
  쇼챔피언: "Show Champion",
};

/**
 * 앨범 판매처일 때만 쓰는 표기. 같은 이름 ENGLISH_NAMES 보다 **이것이 이긴다.**
 *
 * ⚠ `애플뮤직` 하나를 위해 목록을 쪼갠다. 판매처 `애플뮤직`(applemusic.co.kr)은
 *   한국 음반 쇼핑몰이고, 애플의 Apple Music(음원 스트리밍)과 **완전히 다른 회사**다.
 *   그런데 한국어 이름이 글자까지 같아서, 이름만 보고는 구분할 수 없다.
 *
 *   `lib/album.ts` 가 로고를 `applemusic` 과 `shop-applemusic` 으로 나눠 둔 것과
 *   같은 이유이고, 같은 방식으로 나눈다 — 부르는 쪽이 「지금 판매처를 그리는가」를
 *   알고 있으므로 거기서 알려주면 된다 (properNoun 의 scope).
 *
 *   한 목록에 두면 운영진이 스밍리스트에 `애플뮤직` 을 넣는 순간 거기에도
 *   「KR album store」가 붙는다 — 아무도 안 보는 사이에 틀리는 종류의 버그다.
 */
const SHOP_NAMES: Record<string, string> = {
  /*
   * 괄호를 붙이는 이유: `AppleMusic` 만 적으면 해외 팬이 애플 서비스로 읽고
   * 엉뚱한 데를 찾는다. 공백 없는 `AppleMusic` 은 이 가게가 자기 영문 표기로
   * 쓰는 형태다 (애플의 `Apple Music` 과 한 칸이 다르다).
   * 좁은 화면에서는 뒤가 잘리는데, 잘려도 「애플 서비스가 아니다」는 남는다.
   */
  애플뮤직: "AppleMusic (KR album store)",
};

const index = (map: Record<string, string>) =>
  new Map(Object.entries(map).map(([ko, en]) => [nameKey(ko), en]));

const COMMON_INDEX = index(ENGLISH_NAMES);
const SHOP_INDEX = index(SHOP_NAMES);

/**
 * 이 이름이 **어느 자리에** 쓰이는가. 같은 한국어가 자리에 따라 다른 회사일 때 쓴다.
 *   · `"platform"`(기본) 음원 플랫폼 — 실시간 차트 · 스밍리스트
 *   · `"shop"`            앨범 판매처 — 예약판매 목록
 */
export type NounScope = "platform" | "shop";

/**
 * 화면에 찍을 이름. 한국어판은 원래 값, 그 외는 영어 표기(없으면 원래 값).
 *
 *     properNoun("예스24", "ja")              // "YES24"
 *     properNoun("예스24", "ko")              // "예스24"
 *     properNoun("애플뮤직", "en")             // "Apple Music"            (음원 플랫폼)
 *     properNoun("애플뮤직", "en", "shop")     // "AppleMusic (KR album store)"
 *     properNoun("새판매처", "en")             // "새판매처" — 아직 영어 표기가 없다
 */
export function properNoun(
  name: string,
  locale: string,
  scope: NounScope = "platform",
): string {
  if (!name || locale === "ko") return name;
  const key = nameKey(name);
  const scoped = scope === "shop" ? SHOP_INDEX.get(key) : undefined;
  return scoped ?? COMMON_INDEX.get(key) ?? name;
}
