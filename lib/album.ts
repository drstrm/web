/*
 * 앨범 예약판매 고정 정보 (기간 · 버전 · 특전)
 * ------------------------------------------------------------------
 * 판매 링크는 여기 두지 않는다. 앨범사 링크 · 팬덤 공구는 운영진이 노션에서
 * 관리한다 (lib/notion.ts 의 getAlbumShops() · getGroupOrders(),
 * 스키마는 docs/notion-album-db.md).
 *
 * 버전 · 특전도 노션으로 옮겼다(「버전별 특전 정리」 DB). 처음에는 「앨범 한 장에
 * 한 번 정해지는 값」이라 코드에 뒀는데, 운영진이 노션에 같은 표를 만들어 두면서
 * 소스가 둘이 됐다. 둘 중 노션을 남긴다 — 특전 문구는 발매 뒤에도 앨범사 공지에
 * 따라 손질되고, 그때 배포를 기다릴 이유가 없다.
 *
 * 그래서 이 파일에 남은 것은 **화면 문구와 로고 목록**뿐이다. 다음 컴백에 고칠 곳:
 * 아래 ALBUM(제목 · 기간) + 노션 세 DB 의 행. 화면 코드는 건드릴 필요가 없다.
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
 * 이름 비교용 키.
 *
 * 노션에 적히는 값은 사람이 치는 것이라 표기가 흔들린다 — `SMini Ver` · `Smini Ver.` ·
 * `Special ver.` 가 다 같은 버전이고, `SMTOWN &STORE` 와 `smtown & store` 도 같은
 * 판매처다. 영문 대소문자 · 마침표 · 공백 · 기호를 털어내고 비교한다.
 *
 * 예약판매 DB 의 열 이름을 특전 DB 의 줄과 맞출 때도 쓴다 (lib/notion.ts).
 */
export const nameKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

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
