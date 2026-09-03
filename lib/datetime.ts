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
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
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
