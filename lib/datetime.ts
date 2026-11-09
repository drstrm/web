/*
 * KST(Asia/Seoul) 표시 변환
 * ------------------------------------------------------------------
 * 노션 날짜 칸은 시각을 적으면 오프셋이 붙은 ISO(`2026-08-27T19:00:00.000+09:00`),
 * 날짜만 적으면 `2026-08-27` 로 온다. 어느 쪽이든 "한국 시간"으로 보여주는 건
 * 전적으로 앱의 몫이므로 변환을 여기 모아둔다.
 * 서버 컴포넌트(UTC)와 브라우저(로컬 시간대)가 같은 결과를 내야 하므로
 * 항상 timeZone 을 명시한다.
 */

/**
 * 지금(KST)의 요일 · 시각.
 * day 는 0=일 ~ 6=토, minutes 는 자정부터의 분(= hour * 60 + 분)이다.
 * "지금 방송 중" 판정처럼 **날짜가 아니라 시간대**만 필요한 곳에서 쓴다.
 */
export function kstNow(now: Date = new Date()): {
  day: number;
  hour: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // hour12:false 로 자정을 "24" 로 주는 구현이 있어 0 으로 되돌린다.
  const hour = Number(get("hour")) % 24;
  return {
    day: days.indexOf(get("weekday")),
    hour,
    minutes: hour * 60 + Number(get("minute")),
  };
}

/** "HH:MM" → 자정부터의 분. 편성표의 끝시각 "24:00"(=1440) 도 그대로 다룬다 */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 오늘(KST) 하루의 절대 시각 범위 `[startMs, endMs)`.
 *
 * 「오늘 안에 있는 일정인가」를 묻는 곳에서 쓴다. 서버는 UTC 로 도는데 하루의
 * 경계는 **KST 자정**이어야 하므로, 날짜를 KST 로 뽑아 거기에 `+09:00` 을 붙여
 * 되돌린다 (그냥 `setHours(0,0,0,0)` 을 쓰면 서버 시간대의 자정이 된다).
 */
export function kstDayRange(now: Date = new Date()): {
  startMs: number;
  endMs: number;
} {
  const startMs = Date.parse(
    `${toSeoulDate(now.toISOString())}T00:00:00+09:00`,
  );
  return { startMs, endMs: startMs + 86_400_000 };
}

/** 한국 시간대. 기본값으로 쓰는 IANA 이름 */
export const SEOUL_TZ = "Asia/Seoul";

/**
 * 보는 사람의 시간대 (IANA 이름, 예: "Asia/Jakarta").
 * **브라우저에서만** 의미가 있다 — 서버에서 부르면 서버(UTC)의 시간대가 나온다.
 * 얻지 못하면 한국 시간으로 떨어진다.
 */
export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || SEOUL_TZ;
  } catch {
    return SEOUL_TZ;
  }
}

/**
 * 시간대의 짧은 이름 ("GMT+7" · "PST" 등). 표시 시각 옆에 붙여
 * 한국 시간이 아님을 알린다. 이름은 날짜에 따라(서머타임) 달라질 수 있어 시각을 받는다.
 */
export function timeZoneLabel(iso: string, timeZone: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
        .formatToParts(new Date(iso))
        .find((p) => p.type === "timeZoneName")?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
}

/** 절대시각 → 주어진 시간대의 "YYYY-MM-DD" */
export function dateIn(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** 그 순간 그 시간대가 UTC 보다 몇 ms 앞서는가 (KST 면 +9시간) */
function offsetMs(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  // 초 단위 아래는 버린다 — 오프셋은 분 단위라 비교가 깔끔해진다
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/**
 * 그 시간대에서 `YYYY-MM-DD` 가 시작되는 절대시각(ms).
 * 오프셋을 한 번 어림한 뒤 그 시각의 오프셋으로 다시 맞춘다 — 서머타임이 바뀌는
 * 날에도 하루의 시작이 한 시간 밀리지 않게.
 */
function midnightIn(ymd: string, timeZone: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d);
  const guess = wall - offsetMs(wall, timeZone);
  return wall - offsetMs(guess, timeZone);
}

/**
 * 주어진 시간대에서 「오늘」 하루의 절대시각 범위 `[startMs, endMs)`.
 * 서머타임이 바뀌는 날은 23 · 25시간이라 끝은 **다음 날의 자정**으로 따로 구한다.
 */
export function dayRangeIn(
  now: number,
  timeZone: string,
): { startMs: number; endMs: number } {
  const today = dateIn(now, timeZone);
  const startMs = midnightIn(today, timeZone);
  // 36시간을 더해 날짜를 넘긴다 — 23시간짜리 날에도 확실히 다음 날에 떨어진다
  const tomorrow = dateIn(startMs + 36 * 3_600_000, timeZone);
  return { startMs, endMs: midnightIn(tomorrow, timeZone) };
}

/** 노션 ISO → 주어진 시간대의 "18:00" */
export function formatTimeIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * 노션 ISO → 주어진 시간대의 "03.05 18:10".
 * 조각(formatToParts)으로 짠다 — ko-KR 의 통째 출력은 "03. 05. 18:10" 이라 점 뒤 공백을
 * 지우는 식으로 다듬으면 날짜와 시각 사이 공백까지 사라져 "03.05.18:10" 이 된다.
 */
export function formatDateTimeIn(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // hour12:false 로 자정을 "24" 로 주는 구현이 있어 "00" 으로 되돌린다
  const hour = String(Number(get("hour")) % 24).padStart(2, "0");
  return `${get("month")}.${get("day")} ${hour}:${get("minute")}`;
}

/** 노션 ISO → KST "18:00" (날짜를 아는 자리에서 시각만 보여줄 때) */
export function formatKstTime(iso: string): string {
  return formatTimeIn(iso, SEOUL_TZ);
}

/** 노션 ISO → KST 기준 "YYYY-MM-DD" (달력은 날짜 단위로만 다룬다) */
export function toSeoulDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** 노션 ISO → KST "03.05 18:10" */
export function formatKstDateTime(iso: string): string {
  return formatDateTimeIn(iso, SEOUL_TZ);
}

/**
 * 차트 수집 시각 `"YYYY.MM.DD HH"` → `"MM.DD HH:00"`.
 *
 * 수파베이스 `chart_entries.chart_hour` 는 수집기가 **KST 로 찍어 넣은 문자열**이다
 * (chart-bot 의 `_kst_chart_hour`). 이미 KST 라 시간대 변환을 하지 않는다 — Date 로
 * 바꿔 다시 포맷하면 시간대를 한 번 더 적용해 한 시간씩 밀 위험만 생긴다.
 *
 * 형식이 다르면 **그대로 내보낸다.** 수집기가 형식을 바꿨다는 신호이고, 그때
 * 「Invalid Date」를 보여주는 것보다 원문이 낫다.
 */
export function formatChartHour(chartHour: string): string {
  const parsed = /^\d{4}\.(\d{2})\.(\d{2})\s+(\d{1,2})$/.exec(chartHour.trim());
  if (!parsed) return chartHour;
  const [, month, day, hour] = parsed;
  return `${month}.${day} ${hour.padStart(2, "0")}:00`;
}

/** 노션 ISO → KST "03.05" (하루 종일 일정용) */
export function formatKstDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(iso))
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}

/**
 * 기간 표시. "03.05 18:10 ~ 03.05 19:10"
 * allDay 면 시각을 떼고 "03.05 ~ 03.09" 로, 종료일이 없으면 시작만 보여준다.
 */
export function formatKstPeriod(
  startIso: string,
  endIso?: string | null,
  allDay = false,
): string {
  const fmt = allDay ? formatKstDate : formatKstDateTime;
  const start = fmt(startIso);
  if (!endIso) return start;
  const end = fmt(endIso);
  return start === end ? start : `${start} ~ ${end}`;
}
