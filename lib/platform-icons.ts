/*
 * 플랫폼 아이콘 목록
 * ------------------------------------------------------------------
 * 이미지는 public/icons 에 있고, key 는 노션 일정 DB 의 `플랫폼` 값과 같다.
 * 값은 이미지 alt 로 쓰는 표시 이름.
 *
 * **key 는 파일 이름이 아니다.** 실제 파일에는 버전 꼬리표가 붙어 있고
 * (`melon_2611.png` — 캐시를 1년 물리므로 교체 때 주소가 달라져야 한다),
 * 그 연결은 lib/icon-manifest.ts 가 쥔다. 디렉터리를 훑어 자동 생성되는 파일이라
 * 아이콘마다 꼬리표가 달라도 되고, 교체할 때 코드를 고칠 일도 없다
 * (scripts/gen-icon-manifest.mjs).
 *
 * 아이콘 추가 시: public/icons/ 에 <key>_<YYMM>.png 를 넣고 여기에 한 줄 추가한다.
 * (여기 없는 key 는 아이콘이 없는 것으로 보고 PlatformIcon 이 fallback 을 그린다 —
 *  파일과 목록 중 한쪽만 있으면 생성 스크립트가 경고한다)
 */

export const PLATFORM_ICONS: Record<string, string> = {
  applemusic: "애플뮤직",
  bugs: "벅스",
  coogoong: "쿠궁",
  flo: "플로",
  genie: "지니",
  higher: "하이어",
  idolchamp: "아이돌챔프",
  kakaomusic: "카카오뮤직",
  linc: "링크",
  melon: "멜론",
  mnetplus: "엠넷플러스",
  mubeat: "뮤빗",
  muniverse: "뮤니버스",
  spotify: "스포티파이",
  vibe: "바이브",
};

export type PlatformKey = keyof typeof PLATFORM_ICONS;
