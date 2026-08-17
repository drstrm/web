/*
 * ONECLICK 데이터 (기획안 2 · 4: 원클릭 필수 기능)
 * 자주 교체되는 링크는 노션 DB · Supabase 로 뺐다. 여기 남은 건 표기용 상수다.
 */

import { hhmmToMinutes, kstNow } from "@/lib/datetime";

/**
 * 스밍리스트 원클릭의 데이터는 노션 DB 에서 온다
 * (lib/notion.ts 의 getStreamingLists → lib/content.ts).
 * 여기에는 화면 표기용 상수만 남긴다.
 */

/**
 * 운영체제 뱃지 이모지. 키는 노션 `운영체제` 선택지(iOS 는 lib/notion.ts 에서 표기 보정).
 * 여기 없는 선택지를 노션에서 추가해도 이모지만 빠질 뿐 링크는 정상 노출된다.
 */
export const OS_EMOJI: Record<string, string> = {
  안드로이드: "🤖",
  iOS: "🍎",
  아이패드: "📱",
  PC: "💻",
  앱: "📲",
};

/**
 * 앱 투표 원클릭
 * 투표 기간과 실제 투표 URL은 Supabase 공용 `schedules` 테이블에서 가져온다(lib/votes.ts).
 * 여기 href는 진행중 투표가 없을 때 연결되는 기본 링크(앱/사이트 홈).
 * key는 DB의 icon_type 과 일치해야 매칭된다(= public/icons 아이콘 파일명).
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
  { key: "coogoong", name: "쿠궁", show: "coogoong · 뮤직뱅크", href: "https://open.fanca.io/" },
  { key: "mnetplus", name: "엠넷플러스", show: "Mnet Plus · 엠카운트다운", href: "https://www.mnetplus.world/" },
  { key: "mubeat", name: "뮤빗", show: "Mubeat · 음악중심", href: "https://www.mubeat.tv/" },
  { key: "muniverse", name: "뮤니버스", show: "muniverse · 음악중심", href: "https://www.muniverse.io/" },
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

/** 지금(KST) 방송 중인 음악방송 슬롯. 없으면 null */
export function findSmsVoteSlot(now: Date = new Date()): SmsVoteSlot | null {
  const { day, minutes } = kstNow(now);
  return (
    SMS_VOTE_SLOTS.find(
      (s) =>
        s.day === day &&
        minutes >= hhmmToMinutes(s.start) &&
        minutes < hhmmToMinutes(s.end)
    ) ?? null
  );
}

/*
 * 라디오는 편성표 · 문자 신청 로직이 통째로 lib/radio.ts 로 갔다.
 * (방송사별 편성표 · 지금 방송 중인 프로그램 · 사연 자동 생성)
 */
