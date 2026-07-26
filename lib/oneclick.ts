/*
 * ONECLICK 데이터 (기획안 2 · 4: 원클릭 필수 기능)
 * 링크는 관리인이 자주 교체 → 운영 시 Notion DB 연동 지점.
 */

/** 스밍리스트 · 스트리밍 원클릭 (플랫폼별 재생목록 링크) */
export const STREAMING_LISTS: { platform: string; emoji: string; href: string }[] = [
  { platform: "멜론 스밍리스트", emoji: "🍈", href: "https://melon.com/" },
  { platform: "지니 스밍리스트", emoji: "🧞", href: "https://genie.co.kr/" },
  { platform: "벅스 스밍리스트", emoji: "🐛", href: "https://bugs.co.kr/" },
  { platform: "플로 스밍리스트", emoji: "🌊", href: "https://music-flo.com/" },
  { platform: "유튜브 뮤직", emoji: "▶️", href: "https://music.youtube.com/" },
  { platform: "스포티파이", emoji: "🟢", href: "https://open.spotify.com/" },
];

/**
 * 앱 투표 원클릭
 * 투표 기간과 실제 투표 URL은 Supabase `daily_todos`에서 가져온다(lib/votes.ts).
 * 여기 href는 진행중 투표가 없을 때 연결되는 기본 링크(앱/사이트 홈).
 * key는 DB의 icon_type과 일치해야 매칭된다.
 */
export type VoteAppSlot = {
  key: string;
  name: string;
  /** 연동 음악방송 · 투표명 */
  show: string;
  /** 기본(대기중) 링크 */
  href: string;
};

export const VOTE_APPS: VoteAppSlot[] = [
  { key: "fancast", name: "팬캐스트", show: "FANCAST · 뮤직뱅크", href: "https://open.fanca.io/" },
  { key: "mnetplus", name: "엠넷플러스", show: "Mnet Plus · 엠카운트다운", href: "https://www.mnetplus.world/" },
  { key: "mubeat", name: "뮤빗", show: "Mubeat · 음악중심", href: "https://www.mubeat.tv/" },
  { key: "linc", name: "링크", show: "LiNC · 인기가요", href: "https://www.linc.fan/" },
  { key: "higher", name: "하이어", show: "HIGHER · 인기가요", href: "https://higher.market/" },
];

/**
 * 문자 투표 원클릭 (시간대별 음악방송)
 * 현재는 전 구간 비활성화. 실시간 문자투표가 열리면 해당 슬롯의
 * number/keyword를 채우고 enabled를 true로 바꾸면 바로 전송됩니다.
 */
export type SmsVoteSlot = {
  show: string;
  /** 0=일 ~ 6=토 (KST 기준) */
  day: number;
  /** 실시간 투표 구간 (KST, "HH:MM") */
  start: string;
  end: string;
  number: string;
  keyword: string;
  enabled: boolean;
};

export const SMS_VOTE_SLOTS: SmsVoteSlot[] = [
  { show: "쇼챔피언", day: 3, start: "18:00", end: "19:30", number: "", keyword: "", enabled: false },
  { show: "엠카운트다운", day: 4, start: "18:00", end: "19:30", number: "", keyword: "", enabled: false },
  { show: "뮤직뱅크", day: 5, start: "17:00", end: "18:30", number: "", keyword: "", enabled: false },
  { show: "쇼! 음악중심", day: 6, start: "15:15", end: "16:40", number: "", keyword: "", enabled: false },
  { show: "인기가요", day: 0, start: "15:40", end: "17:00", number: "", keyword: "", enabled: false },
];

/** KST 기준 요일(0=일)과 분 단위 시각 */
function kstNow(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(get("weekday")),
    minutes: Number(get("hour")) % 24 * 60 + Number(get("minute")),
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 지금(KST) 방송 중인 음악방송 슬롯. 없으면 null */
export function findSmsVoteSlot(now: Date = new Date()): SmsVoteSlot | null {
  const { day, minutes } = kstNow(now);
  return (
    SMS_VOTE_SLOTS.find(
      (s) => s.day === day && minutes >= toMinutes(s.start) && minutes < toMinutes(s.end)
    ) ?? null
  );
}

/** 방송사별 라디오 시간표 */
export const RADIO_SCHEDULE: { station: string; program: string; time: string }[] = [
  { station: "KBS", program: "라디오 프로그램", time: "시간표 업데이트 예정" },
  { station: "MBC", program: "라디오 프로그램", time: "시간표 업데이트 예정" },
  { station: "SBS", program: "라디오 프로그램", time: "시간표 업데이트 예정" },
];

/** 라디오 신청 원클릭 (안드로이드 / iOS 분리) */
export const RADIO_APPLY: { station: string; android: string; ios: string }[] = [
  { station: "KBS 쿨FM", android: "https://play.google.com/", ios: "https://apps.apple.com/" },
  { station: "MBC 표준FM", android: "https://play.google.com/", ios: "https://apps.apple.com/" },
  { station: "SBS 파워FM", android: "https://play.google.com/", ios: "https://apps.apple.com/" },
];
