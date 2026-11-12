/*
 * 수파베이스 조회 (REST)
 * ------------------------------------------------------------------
 * SDK(@supabase/supabase-js) 없이 fetch 만 쓴다 — 이유는 lib/notion.ts 와 같다.
 * Next 의 데이터 캐시는 fetch() 에만 붙으므로, SDK 를 쓰면 ISR 을 쓰려고
 * unstable_cache 로 한 겹 더 감싸야 한다. 의존성도 하나 늘지 않는다.
 *
 * 키는 **publishable key** 다 — 브라우저에 나가도 되게 설계된 값이고 실제 접근
 * 권한은 테이블의 RLS 가 정한다. 그래도 `NEXT_PUBLIC_` 을 붙이지 않았다. 지금
 * 필요한 조회가 서버 렌더 중에 끝나서 키를 번들에 실을 이유가 없고, 나중에 브라우저
 * 에서 직접 부를 일이 생기면 그때 접두어 붙은 변수를 따로 두는 쪽이 안전하다.
 */

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

/**
 * 테이블 한 번 조회. `query` 는 PostgREST 쿼리스트링 그대로다
 * (`select=…&artist=eq.…&order=created_at.desc`).
 */
async function select<T>(table: string, query: string, revalidate: number): Promise<T[]> {
  if (!BASE || !KEY) {
    throw new Error("SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY 환경변수가 설정되지 않았습니다.");
  }
  const res = await fetch(`${BASE}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Accept: "application/json",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // 401·403 은 키가 틀렸거나 RLS 가 select 를 막은 경우가 대부분이다.
    throw new Error(`Supabase ${res.status}: ${table} — ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<T[]>;
}

/* ---------------- 실시간 차트 (chart_entries) ---------------- */

/*
 * 테이블 구조는 수집기 저장소(chart-bot)의 `sql/schema.sql` 이 기준이다.
 *
 * 한 번의 수집(run)이 `scrape_runs` 에 한 줄 남고, 그 run 이 잡은 플랫폼별 순위가
 * `chart_entries` 에 여러 줄 쌓인다 — `run_id` 로 묶이고 `chart_hour` 가 그 시각이다.
 * 그래서 「지금 차트」는 **가장 최근 run 의 줄 묶음**이다. 플랫폼별로 최신 줄을
 * 따로 고르면 서로 다른 시각의 순위가 한 화면에 섞인다.
 */

/** `chart_entries` 에서 화면이 쓰는 열만 */
export interface ChartEntry {
  /** 수집기의 플랫폼 키 (`melon_top` · `genie` …). 이름 붙이기는 lib/content.ts */
  source: string;
  rank: number;
  /** 직전 수집 대비 변동. 신규 진입처럼 비교 대상이 없으면 null */
  change: number | null;
}

/** 수집 1회 = 화면에 띄우는 차트 한 벌 */
export interface ChartRun {
  /** `"YYYY.MM.DD HH"` (KST). 고정 폭이라 **문자열 정렬이 곧 시간순**이다 */
  chartHour: string;
  entries: ChartEntry[];
}

/**
 * 곡 필터.
 *
 * `eq` 가 아니라 `ilike`(부분 일치)다. 수집기는 차트 사이트에 적힌 이름을 **그대로**
 * 저장하고 추적 여부만 부분 일치로 판단하기 때문에(chart-bot 의 `_matches_targets`,
 * `matchType: "includes"`), `artist` 에 `NCT DREAM (엔시티 드림)` 처럼 꼬리가 붙어
 * 들어올 수 있다. 완전 일치로 거르면 **조용히 빈 결과**가 된다.
 *
 * 한 테이블에 여러 그룹 · 곡이 같이 쌓이므로(수집기의 tracker.json 은 6팀을 본다)
 * 이 필터는 **두 단계 모두에** 붙어야 한다. 빼면 다른 팀의 순위가 섞인다.
 */
const songFilter = (artist: string, title: string) =>
  [
    `artist=ilike.*${encodeURIComponent(artist)}*`,
    `title=ilike.*${encodeURIComponent(title)}*`,
  ].join("&");

/**
 * 한 곡의 **가장 최근 수집 한 벌**. 기록이 아예 없으면 null.
 *
 * 두 번 조회한다 — 최근 run 을 찾고(1), 그 run 의 줄을 받는다(2). 한 번에 받아
 * 걸러낼 수도 있지만 그러려면 「한 run 이 몇 줄인가」를 limit 으로 가정해야 하고,
 * 수집기가 차트를 추가하는 순간 조용히 틀린다. 조회는 캐시되므로(revalidate)
 * 왕복이 한 번 늘어도 노출 비용은 사실상 없다.
 */
export async function getLatestChart(opts: {
  artist: string;
  title: string;
  revalidate: number;
}): Promise<ChartRun | null> {
  const filter = songFilter(opts.artist, opts.title);

  const [latest] = await select<{ run_id: number | null; chart_hour: string }>(
    "chart_entries",
    `select=run_id,chart_hour&${filter}&order=chart_hour.desc&limit=1`,
    opts.revalidate,
  );
  if (!latest) return null;

  // run_id 로 묶는다. 비어 있는 줄(예전 데이터)만 chart_hour 로 묶어 준다 —
  // `run_id` 는 스키마상 null 을 허용하고 `chart_hour` 는 not null 이다.
  const group =
    latest.run_id === null
      ? `chart_hour=eq.${encodeURIComponent(latest.chart_hour)}`
      : `run_id=eq.${latest.run_id}`;

  const entries = await select<ChartEntry>(
    "chart_entries",
    `select=source,rank,change&${filter}&${group}&order=rank.asc&limit=50`,
    opts.revalidate,
  );

  return { chartHour: latest.chart_hour, entries };
}

/* ---------------- 라디오 사연 문장 (radio_messages) ---------------- */

/*
 * 매일 00시(KST) 예약 작업이 그날 하루치 문장을 넣는다 — 스키마는 sql/radio_messages.sql,
 * 넣는 쪽은 scripts/radio-daily-insert.mjs, 쓰는 규칙은 docs/radio-message-prompt.md.
 * 줄이 없으면(작업 실패 · 아직 안 돎) 호출부가 코드에 있는 기본 문장 풀로 돌아간다.
 */

export interface RadioMessageRow {
  /** morning · lunch · afternoon · evening · night · all */
  time_slot: string;
  text: string;
}

/** 그날(KST `YYYY-MM-DD`) 문장 전부 */
export function getRadioMessages(date: string, revalidate: number): Promise<RadioMessageRow[]> {
  return select<RadioMessageRow>(
    "radio_messages",
    `select=time_slot,text&date=eq.${encodeURIComponent(date)}&limit=500`,
    revalidate,
  );
}

/* ---------------- 라디오 선곡 기록 (radio_played) ---------------- */

/*
 * 신청곡(NCT DREAM의 Boogie Woogie)이 그날 그 프로그램에서 나왔다는 기록. 한 줄 = 날짜 · 채널 · 프로그램.
 * 넣는 쪽은 scripts/radio-played-check.mjs· 수파베이스 엣지 펑션이 2시간마다 방송사 선곡표를 확인, 스키마는
 * sql/radio_played.sql.
 */

export interface RadioPlayedRow {
  /** KST `YYYY-MM-DD` */
  date: string;
  /** RADIO_STATIONS 의 number (`#1077` …) */
  station: string;
  /** 손으로 넣은 줄은 비어 있을 수 있다 */
  program: string | null;
}

/** 선곡 기록 전부, 최신순. 하루에 많아야 몇 줄이라 한 번에 받는다 */
export function getRadioPlayedHistory(revalidate: number): Promise<RadioPlayedRow[]> {
  return select<RadioPlayedRow>(
    "radio_played",
    "select=date,station,program&order=date.desc,station.asc&limit=1000",
    revalidate,
  );
}
