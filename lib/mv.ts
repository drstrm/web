/*
 * 유튜브 MV 실시간 수치 — 브라우저 쪽 조회
 * ------------------------------------------------------------------
 * 브라우저에서 유튜브 watch 페이지를 직접 긁을 수 없어서(CORS) 서버를 거친다.
 * app/api/mv-stats 가 대신 긁고(lib/youtube.ts), 여기서는 결과만 받는다.
 *
 * 영상 id 로 맞춰 넣는다 — 카드 제목은 운영중에 바뀔 수 있어 키로 쓰기 불안하다.
 */

export interface MvLiveStats {
  /** lib/content.ts 의 getMvStats 가 준 것과 같은 영상 id */
  youtubeId: string;
  /** "1,812,565,058" — 조회 실패 시 빈 문자열 */
  views: string;
  likes: string;
}

/** 지금 시점의 조회수·좋아요를 영상 id 별로 반환. */
export async function fetchMvLiveStats(): Promise<Record<string, MvLiveStats>> {
  const res = await fetch("/api/mv-stats", { cache: "no-store" });
  if (!res.ok) throw new Error(`mv-stats ${res.status}`);

  const stats = (await res.json()) as MvLiveStats[];

  const byId: Record<string, MvLiveStats> = {};
  for (const stat of stats) {
    if (stat.youtubeId) byId[stat.youtubeId] = stat;
  }
  return byId;
}
