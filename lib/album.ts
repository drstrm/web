/*
 * 앨범 예약판매 고정 정보 (기간 · 버전 · 특전)
 * ------------------------------------------------------------------
 * 판매 링크는 여기 두지 않는다. 앨범사 링크 · 팬덤 공구는 운영진이 노션에서
 * 관리한다 (lib/notion.ts 의 getAlbumShops() · getGroupOrders(),
 * 스키마는 docs/notion-album-db.md).
 *
 * 반대로 아래 값들은 앨범 한 장에 **한 번 정해지고 안 바뀐다**. 기간이 하루
 * 늘어나는 정도의 수정은 있지만, 버전 구성과 특전은 발매 공지가 나온 뒤 바뀌지
 * 않는다. 노션 DB 로 빼면 컴백마다 열 구조부터 다시 만들어야 하는 데 비해
 * 운영진이 얻는 것이 거의 없어서, 컴백 때 이 파일을 고치고 배포하는 쪽을 택했다.
 *
 * 다음 컴백에 고칠 곳: 이 파일 + 노션 두 DB 의 행. 화면 코드는 건드릴 필요가 없다.
 */

export const ALBUM = {
  /** 페이지 제목 · <title> · 홈 · 커뮤니티 카드 제목 */
  title: "DREAM AFTER DREAM 예약판매",
  /** 화면에 그대로 나오는 기간 표기 (자유 텍스트) */
  period: "~ 11/8",
  description:
    "정규 6집 「DREAM AFTER DREAM」 버전별 특전과 앨범사 예약판매 링크, 팬덤 공구를 한곳에 모았어요.",
} as const;

/**
 * 앨범 버전 한 종.
 *
 * 이 배열은 두 가지로 쓰인다.
 *  1. 「버전 · 추가 특전」 표의 줄 (components/AlbumInfo.tsx)
 *  2. **앨범사 카드 안 버전 버튼의 순서와 표기** (lib/notion.ts 의 getAlbumShops)
 *
 * 2번이 여기 있는 이유: 노션 예약판매 DB 는 **버전마다 열이 하나**인 가로형 표라,
 * 버전 순서가 「열 순서」에 담긴다. 그런데 노션 API 는 열 순서를 알려주지 않는다
 * (properties 가 객체로 오고, 실제로 제목 열이 중간에 섞여 온다). 그래서 순서만은
 * 코드가 쥐어야 한다 — 다른 DB 들이 선택지 순서 · `순서` 열로 노션에 맡기는 것과
 * 다른 점이고, 가로형 표를 받는 대가다.
 */
export interface AlbumVersion {
  /**
   * 화면 표기. 노션 열 이름과 **똑같이 적지 않아도 된다** — 대소문자 · 마침표 ·
   * 공백을 털어서 맞춰 보므로(`matchVersion()`), 노션의 `SMini Ver` 와 여기의
   * `SMini Ver.` 가 같은 버전으로 붙는다. 화면에는 이 표기가 나간다.
   */
  name: string;
  /**
   * 이 버전을 파는 곳이 정해져 있으면 그 목록.
   * 비어 있으면 전 앨범사 공통으로 본다 (대부분의 버전이 여기 해당).
   */
  shops?: string[];
  /**
   * **이 버전에만** 붙는 특전. 전 버전이 함께 받는 것은
   * ALBUM_COMMON_BENEFITS 에 둔다 — 표의 모든 줄에 같은 문장이 반복되지 않도록.
   */
  benefits?: string[];
  /**
   * 세트 상품이면 그 단품 버전의 `name`.
   *
   * 세트는 표에서 **줄을 따로 만들지 않고** 단품 줄에 「세트 구매 가능」으로 합친다.
   * 단품 · 세트가 모두 줄이 되면 표가 8줄로 늘어나는데, 사는 사람이 표에서 알고
   * 싶은 것은 「버전이 뭐가 있나」지 「세트가 따로 있나」가 아니다. 세트는 실제로
   * 고를 때(앨범사 카드의 버튼) 보이면 된다.
   */
  setOf?: string;
}

export const ALBUM_VERSIONS: AlbumVersion[] = [
  {
    name: "Photobook Ver.",
    benefits: [
      "초회 한정 포토카드 12종 중 랜덤 2종",
      "세트 구매 시 초회 한정 포토카드 12종 중 랜덤 4종",
    ],
  },
  { name: "Photobook Ver. SET", setOf: "Photobook Ver." },
  { name: "Jewel Case Ver." },
  { name: "Jewel Case Ver. SET", setOf: "Jewel Case Ver." },
  { name: "SMini Ver." },
  { name: "SMini Ver. SET", setOf: "SMini Ver." },
  { name: "Mini Box Ver." },
  { name: "Special Ver.", shops: ["SMTOWN &STORE", "Berriz"] },
];

/** 버전 · 판매처와 무관하게 전 버전이 받는 특전 (표 아래 한 줄로 나온다) */
export const ALBUM_COMMON_BENEFITS: string[] = [
  "미공개 포토카드 6종 중 랜덤 1종 (앨범사별 이미지 상이)",
];

/**
 * 이름 비교용 키 (버전 · 판매처 공용).
 *
 * 노션에 적히는 값은 사람이 치는 것이라 표기가 흔들린다 — `SMini Ver` · `Smini Ver.` ·
 * `Special ver.` 가 다 같은 버전이고, `SMTOWN &STORE` 와 `smtown & store` 도 같은
 * 판매처다. 영문 대소문자 · 마침표 · 공백 · 기호를 털어내고 비교한다.
 */
const nameKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

const VERSION_INDEX = new Map(
  ALBUM_VERSIONS.map((v, order) => [nameKey(v.name), { version: v, order }]),
);

/** 세트가 따로 있는 단품 버전의 key 집합 (표의 「세트 구매 가능」 표기용) */
const HAS_SET = new Set(
  ALBUM_VERSIONS.flatMap((v) => (v.setOf ? [nameKey(v.setOf)] : [])),
);

export const hasSetVersion = (version: AlbumVersion) =>
  HAS_SET.has(nameKey(version.name));

/** 표에 줄로 나가는 버전 (세트는 단품 줄에 합쳐지므로 제외) */
export const ALBUM_TABLE_VERSIONS = ALBUM_VERSIONS.filter((v) => !v.setOf);

/**
 * 노션 열 이름 → 화면 표기 · 순서.
 *
 * 아는 버전이면 이 파일의 표기와 배열 순서를 쓰고, 모르는 열이면(운영진이 이번
 * 컴백에 새 버전을 추가) 열 이름을 그대로 보여주고 맨 뒤에 둔다 — 코드를 고치기
 * 전에도 링크가 화면에 뜨는 편이, 조용히 사라지는 것보다 낫다.
 */
export function matchVersion(columnName: string): { label: string; order: number } {
  const found = VERSION_INDEX.get(nameKey(columnName));
  return found
    ? { label: found.version.name, order: found.order }
    : { label: columnName, order: ALBUM_VERSIONS.length };
}

/* ---------------- 판매처 로고 ---------------- */

/**
 * 판매처 → 로고 파일 (`public/icons/<값>.png`).
 *
 * 키는 노션 `판매처` 에 적힌 이름이고, 비교는 `nameKey()` 로 느슨하게 한다
 * (`Weverse shop` · `weverse shop` 이 같은 칸을 찾는다).
 *
 * 파일 이름에 `shop-` 을 붙여 둔 이유: 스트리밍 플랫폼 아이콘과 이름이 겹친다.
 * 「애플뮤직」은 스밍 가이드에서는 Apple Music(음원 플랫폼)이고 여기서는
 * applemusic.co.kr(앨범 판매처)인데, 둘은 완전히 다른 회사다
 * (lib/platform-icons.ts 의 `applemusic` 과 여기 `shop-applemusic` 이 그래서 따로다).
 *
 * 로고는 각 쇼핑몰이 **자기 사이트에 올려 둔 아이콘**(apple-touch-icon · favicon)을
 * 받아 둔 것이다. 링크 옆에 붙는 식별 표식이라 쓰임새가 북마크 아이콘과 같다.
 *
 * ⚠ 여기 없는 판매처는 아이콘 없이 기본 상점 그림으로 나온다 — 그래서 **빠져도
 *   화면이 깨지지 않는다.** 노션에 판매처를 먼저 추가하고 로고는 나중에 채워도 된다.
 *   넣는 법: `public/icons/shop-<이름>.png` (가로세로 같은, 96px 이상) 한 장과
 *   아래 한 줄. 확장자는 반드시 `.png` 다 — <PlatformIcon> 이 `.png` 로만 찾는다.
 */
export const ALBUM_SHOP_ICONS: Record<string, string> = {
  "Ktown4U": "shop-ktown4u",
  "예스24": "shop-yes24",
  "핫트랙스": "shop-hottracks",
  "애플뮤직": "shop-applemusic",
  "알라딘": "shop-aladin",
  "뮤직코리아": "shop-musickorea",
  "SMTOWN &STORE": "shop-smtownandstore",
  "메이크스타": "shop-makestar",
  "Weverse shop": "shop-weverse",
  "올엠디": "shop-allmd",
  "비트로드": "shop-beatroad",
  "에버라인": "shop-everline",
  "사운드웨이브": "shop-soundwave",
  "위드뮤": "shop-withmuu",
};

const SHOP_ICON_INDEX = new Map(
  Object.entries(ALBUM_SHOP_ICONS).map(([name, icon]) => [nameKey(name), icon]),
);

/** 판매처 이름 → 로고 파일 key. 없으면 undefined (화면은 기본 상점 그림을 쓴다) */
export const matchShopIcon = (name: string): string | undefined =>
  SHOP_ICON_INDEX.get(nameKey(name));
