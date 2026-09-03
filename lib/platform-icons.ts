/*
 * 플랫폼 아이콘 목록
 * ------------------------------------------------------------------
 * 이미지는 public/icons/<key>.png 에 있고, key 는 schedules.icon_type 값과 같다.
 * 값은 이미지 alt 로 쓰는 표시 이름.
 *
 * 아이콘 추가 시: public/icons/ 에 <key>.png 를 넣고 여기에 한 줄 추가한다.
 * (여기 없는 key 는 아이콘이 없는 것으로 보고 PlatformIcon 이 fallback 을 그린다)
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
