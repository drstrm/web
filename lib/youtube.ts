/*
 * 유튜브 MV 조회수 · 좋아요 수집
 * ------------------------------------------------------------------
 * chart/src/collectors/youtube.py 를 그대로 옮겨 왔지만 Playwright 는 쓰지 않는다.
 * 파이썬 쪽은 렌더가 끝난 DOM 에서 좋아요 버튼의 aria-label 을 읽는데, 두 숫자
 * 모두 watch 페이지가 처음 내려주는 HTML 의 ytInitialData 안에 이미 들어 있다.
 * 요청마다 헤드리스 크롬을 띄우는 대신 fetch 한 번으로 끝낸다 — 배포 환경에
 * 크롬을 심을 필요도, 요청당 수 초를 태울 일도 없다.
 *
 * 유튜브가 내부 JSON 키를 바꾸면 조용히 빈 문자열이 된다. 화면은 "—" 로 폴백한다.
 * 숫자가 잠깐 안 보이는 것이, 홈이 500 을 뱉는 것보다 낫다.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";

// 파이썬 수집기의 wait_for_selector 예산과 같게 둔다.
const TIMEOUT_MS = 7_000;

export interface YoutubeStats {
  /** "1,812,565,058" — 못 가져오면 빈 문자열 */
  views: string;
  /** "19,374,207" — 못 가져오면 빈 문자열 */
  likes: string;
}

const EMPTY: YoutubeStats = { views: "", likes: "" };

/*
 * 앞에서부터 시도하고 처음 걸리는 값을 쓴다.
 * 앞쪽 둘은 로케일과 무관한 원시 숫자라 우선순위가 높고, 마지막 문구 패턴은
 * 유튜브가 키 이름을 갈아엎었을 때를 위한 보험이다.
 */
const VIEW_PATTERNS = [
  /"viewCount":"(\d+)"/, //                        videoDetails 의 원시 값
  /"viewCount":\{"simpleText":"[^"]*?([\d,]+)회/, // "조회수 1,812,565,058회"
];

const LIKE_PATTERNS = [
  /"likeCountIfIndifferentNumber":"(\d+)"/, // 로그인하지 않은 방문자에게 보이는 값
  /"likeCount":"(\d+)"/,
  /"accessibilityText":"[^"]*?([\d,]+)명과/, // 파이썬 수집기가 읽던 바로 그 문구
];

/** 패턴을 차례로 대 보고 첫 성공을 "1,234,567" 로 만들어 돌려준다. */
function pick(html: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const raw = re.exec(html)?.[1];
    if (!raw) continue;

    const n = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(n)) return n.toLocaleString("ko-KR");
  }
  return "";
}

/**
 * 영상 하나의 조회수 · 좋아요 수 조회. 실패해도 던지지 않고 빈 값을 준다.
 *
 * @param videoId 유튜브 영상 id (전체 URL 이 아니라 `dQw4w9WgXcQ` 부분)
 */
export async function fetchYoutubeStats(videoId: string): Promise<YoutubeStats> {
  if (!videoId) return EMPTY;

  try {
    const res = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      {
        headers: {
          // 봇으로 보이면 축약된 HTML 이 와서 두 숫자가 통째로 빠진다.
          "user-agent": USER_AGENT,
          // 마지막 폴백 패턴이 한국어 문구를 읽으므로 로케일을 고정한다.
          "accept-language": "ko-KR,ko;q=0.9",
        },
        // 이 함수를 부르는 라우트가 매 요청 갱신이라 Next 의 fetch 캐시도 끈다.
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      console.error(`유튜브 조회수 조회 실패: ${videoId} → ${res.status}`);
      return EMPTY;
    }

    const html = await res.text();
    return {
      views: pick(html, VIEW_PATTERNS),
      likes: pick(html, LIKE_PATTERNS),
    };
  } catch (e) {
    console.error(`유튜브 조회수 조회 실패: ${videoId}`, e);
    return EMPTY;
  }
}
