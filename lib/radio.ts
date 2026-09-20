/*
 * 라디오 편성표 · 문자 신청 번호 (2026.09 기준)
 * ------------------------------------------------------------------
 * 원클릭 문자 신청(components/RadioOneclick.tsx)과 사연 생성 API가 함께 쓰는
 * 데이터다. 방송사별 전체 편성표 화면은 public/radio 이미지 파일을 보여준다.
 *
 * 사연 문장 풀과 생성 로직은 lib/radio-message.ts 에 따로 있다.
 * 문장 풀이 2만 자가 넘어서, 같이 두면 편성표만 필요한 화면까지
 * 브라우저로 딸려 내려간다 — 그쪽은 서버(API 라우트)에서만 읽는다.
 *
 * ⚠ 편성 개편이 있으면 RADIO_SCHEDULE 만 고치면 된다.
 *   possibility(신청 가능성)는 가이드 이미지 표기를 그대로 옮긴 값이다 —
 *   하이라이트 2(가능성 높음) · 굵은글씨 1(가능성 있음) · 보통 0(신청 어려움).
 *   이미지에 안 실린 편성(심야 · 뉴스 등)은 0 으로 둔다.
 */

import { hhmmToMinutes, kstNow } from "@/lib/datetime";

/** 신청 가능성 — 0: 어려움, 1: 있음, 2: 높음 */
export type Possibility = 0 | 1 | 2;

/** 편성이 요일을 타는 경우. 없으면 매일 같은 편성이다 */
export type DayType =
  | "weekday"
  | "weekend"
  | "saturday"
  | "sunday"
  | "monWed"
  | "thuFri";

export type RadioStation = {
  /** 문자 신청 번호. sms: 링크에 그대로 들어간다 */
  number: string;
  /** 방송사 (버튼 묶음 단위) */
  group: string;
  name: string;
  frequency: string;
};

/** 문자 신청을 받는 채널. 화면의 버튼 순서 = 이 배열 순서 */
export const RADIO_STATIONS: RadioStation[] = [
  { number: "#1077", group: "SBS", name: "SBS 파워FM", frequency: "107.7 MHz" },
  { number: "#1035", group: "SBS", name: "SBS 러브FM", frequency: "103.5 MHz" },
  { number: "#8910", group: "KBS", name: "KBS COOL FM", frequency: "89.1 MHz" },
  { number: "#8000", group: "MBC", name: "MBC FM4U", frequency: "91.9 MHz" },
  { number: "#8001", group: "MBC", name: "MBC 표준FM", frequency: "95.9 MHz" },
];

export type RadioSlot = {
  /** RADIO_STATIONS 의 number */
  station: string;
  /** KST "HH:MM". 끝시각은 자정을 24:00 으로 적는다 */
  start: string;
  end: string;
  /** 사연에서 부르는 호칭. 없으면 호칭 없이 문장이 만들어진다 */
  djName: string | null;
  program: string;
  /** 없으면 매일 */
  dayType?: DayType;
  possibility: Possibility;
};

export const RADIO_SCHEDULE: RadioSlot[] = [
  // ── SBS 파워FM #1077 ──────────────────────────────
  { station: "#1077", start: "01:00", end: "03:00", djName: null, program: "애프터 클럽", possibility: 1 },
  { station: "#1077", start: "03:00", end: "05:00", djName: null, program: "파워 스테이션", possibility: 0 },
  { station: "#1077", start: "05:00", end: "07:00", djName: "이인권님", program: "이인권의 펀펀투데이", possibility: 2 },
  { station: "#1077", start: "07:00", end: "09:00", djName: "철업디", program: "김영철의 파워 FM", possibility: 2 },
  { station: "#1077", start: "09:00", end: "11:00", djName: "봉태규님", program: "아름다운 이 아침, 봉태규입니다", possibility: 2 },
  { station: "#1077", start: "11:00", end: "12:00", djName: "박하선님", program: "박하선의 씨네타운", possibility: 0 },
  { station: "#1077", start: "12:00", end: "14:00", djName: "주디", program: "12시엔 주현영", possibility: 2 },
  { station: "#1077", start: "14:00", end: "16:00", djName: null, program: "두시탈출 컬투쇼", possibility: 1 },
  { station: "#1077", start: "16:00", end: "18:00", djName: "퐝디", program: "황제성의 황제파워", possibility: 2 },
  { station: "#1077", start: "18:00", end: "20:00", djName: "라송", program: "박소현의 러브게임", possibility: 2 },
  { station: "#1077", start: "20:00", end: "22:00", djName: "완디", program: "웬디의 영스트리트", possibility: 2 },
  { station: "#1077", start: "22:00", end: "23:00", djName: "배성재님", program: "배성재의 텐", possibility: 2 },
  { station: "#1077", start: "23:00", end: "24:00", djName: "딘디", program: "딘딘의 뮤직하이", possibility: 2 },

  // ── SBS 러브FM #1035 ──────────────────────────────
  { station: "#1035", start: "00:00", end: "02:00", djName: null, program: "YESTERDAY 20", possibility: 0 },
  { station: "#1035", start: "02:00", end: "04:00", djName: null, program: "Love 20", possibility: 0 },
  { station: "#1035", start: "04:00", end: "06:00", djName: null, program: "Oldies 20", possibility: 0 },
  { station: "#1035", start: "06:05", end: "07:00", djName: "고현준님", program: "고현준의 뉴스 브리핑", dayType: "weekday", possibility: 0 },
  { station: "#1035", start: "06:00", end: "07:00", djName: "김선재님", program: "김선재의 책하고 놀자", dayType: "weekend", possibility: 0 },
  { station: "#1035", start: "07:00", end: "09:00", djName: "김태현님", program: "김태현의 정치쇼", dayType: "weekday", possibility: 0 },
  { station: "#1035", start: "07:00", end: "09:00", djName: "DJ래피", program: "DJ래피의 드라이브 뮤직", dayType: "weekend", possibility: 2 },
  { station: "#1035", start: "09:05", end: "11:00", djName: "숙영님", program: "이숙영의 러브FM", dayType: "weekday", possibility: 0 },
  { station: "#1035", start: "09:05", end: "11:00", djName: "최영주님", program: "최영주의 러브FM", dayType: "weekend", possibility: 0 },
  { station: "#1035", start: "11:00", end: "12:00", djName: "박연미님", program: "박연미의 목돈연구소", possibility: 0 },
  { station: "#1035", start: "12:05", end: "14:00", djName: "민상님", program: "유민상의 배고픈 라디오", possibility: 0 },
  { station: "#1035", start: "14:20", end: "16:00", djName: "정엽님", program: "그대의 오후, 정엽입니다", possibility: 2 },
  { station: "#1035", start: "16:00", end: "17:00", djName: null, program: "인생은 오디션", dayType: "weekday", possibility: 0 },
  { station: "#1035", start: "16:00", end: "18:00", djName: "DJ래피", program: "DJ래피의 드라이브 뮤직", dayType: "weekend", possibility: 2 },
  { station: "#1035", start: "17:00", end: "18:00", djName: "편상욱님", program: "편상욱의 뉴스직격", dayType: "weekday", possibility: 0 },
  { station: "#1035", start: "18:05", end: "20:00", djName: "창완님", program: "6시 저녁바람 김창완입니다", possibility: 0 },
  { station: "#1035", start: "20:05", end: "22:00", djName: "윤상님", program: "김윤상의 뮤직투나잇", possibility: 1 },
  { station: "#1035", start: "22:05", end: "24:00", djName: "박은경님", program: "음악이 흐르는 밤, 박은경입니다", possibility: 1 },

  // ── KBS COOL FM #8910 ─────────────────────────────
  { station: "#8910", start: "00:00", end: "05:00", djName: null, program: "Station Zero", dayType: "weekday", possibility: 2 },
  { station: "#8910", start: "00:00", end: "05:00", djName: null, program: "Station X", dayType: "weekend", possibility: 2 },
  { station: "#8910", start: "05:00", end: "07:00", djName: "허유원님", program: "허유원의 상쾌한 아침", possibility: 0 },
  { station: "#8910", start: "07:00", end: "09:00", djName: "정식님", program: "조정식의 FM 대행진", possibility: 1 },
  { station: "#8910", start: "09:00", end: "11:00", djName: "현우님", program: "이현우의 음악앨범", possibility: 0 },
  { station: "#8910", start: "11:00", end: "12:00", djName: "쥐팍", program: "박명수의 라디오쇼", possibility: 2 },
  { station: "#8910", start: "12:00", end: "14:00", djName: "폴디", program: "폴킴의 가요광장", possibility: 2 },
  { station: "#8910", start: "14:00", end: "16:00", djName: "퀸디", program: "가비의 슈퍼라디오", possibility: 2 },
  { station: "#8910", start: "16:00", end: "18:00", djName: "정수님, 창희님", program: "윤정수 남창희의 미스터 라디오", possibility: 2 },
  { station: "#8910", start: "18:00", end: "20:00", djName: "이금희님", program: "사랑하기 좋은날 이금희 입니다", possibility: 0 },
  { station: "#8910", start: "20:00", end: "22:00", djName: "쩡디", program: "오마이걸 효정의 볼륨을 높여요", possibility: 2 },
  { station: "#8910", start: "22:00", end: "24:00", djName: "샴디", program: "한해의 키스더라디오", possibility: 2 },

  // ── MBC FM4U #8000 ────────────────────────────────
  { station: "#8000", start: "00:00", end: "01:00", djName: "세윤님", program: "FM영화음악 김세윤입니다", possibility: 0 },
  { station: "#8000", start: "01:00", end: "03:00", djName: null, program: "아이돌라디오 핫트랙", possibility: 0 },
  { station: "#8000", start: "03:00", end: "05:00", djName: null, program: "음악의 발견", possibility: 0 },
  { station: "#8000", start: "05:00", end: "06:00", djName: null, program: "여기는 MBC-FM4U", dayType: "weekday", possibility: 0 },
  { station: "#8000", start: "05:00", end: "06:00", djName: null, program: "응답하라 20세기", dayType: "weekend", possibility: 0 },
  { station: "#8000", start: "06:00", end: "07:00", djName: "영은님", program: "세상을 여는 아침, 이영은입니다", possibility: 1 },
  { station: "#8000", start: "07:00", end: "09:00", djName: "테디", program: "굿모닝 FM 테이입니다", possibility: 2 },
  { station: "#8000", start: "09:00", end: "11:00", djName: "윤상님", program: "오늘 아침 윤상입니다", possibility: 0 },
  { station: "#8000", start: "11:00", end: "12:00", djName: "문세님", program: "안녕하세요 이문세입니다", possibility: 0 },
  { station: "#8000", start: "12:00", end: "14:00", djName: "신디", program: "정오의 희망곡 김신영입니다", possibility: 2 },
  { station: "#8000", start: "14:00", end: "16:00", djName: "영미님", program: "두시의 데이트 안영미입니다", possibility: 2 },
  { station: "#8000", start: "16:00", end: "18:00", djName: "순디", program: "완벽한 하루 이상순입니다", possibility: 0 },
  { station: "#8000", start: "18:00", end: "20:00", djName: "배철수님", program: "배철수의 음악캠프", possibility: 0 },
  { station: "#8000", start: "20:00", end: "22:00", djName: "대장부엉", program: "김이나의 별이 빛나는 밤에", possibility: 2 },
  { station: "#8000", start: "22:00", end: "24:00", djName: "태래님", program: "제로베이스원의 친한친구", dayType: "monWed", possibility: 2 },
  { station: "#8000", start: "22:00", end: "24:00", djName: "선우님, 에릭님", program: "IDOL RADIO 시즌4", dayType: "thuFri", possibility: 2 },
  { station: "#8000", start: "22:00", end: "24:00", djName: "영배님", program: "스포왕 고영배", dayType: "weekend", possibility: 2 },

  // ── MBC 표준FM #8001 ──────────────────────────────
  { station: "#8001", start: "00:00", end: "02:00", djName: null, program: "낭만가요", possibility: 0 },
  { station: "#8001", start: "02:00", end: "04:00", djName: null, program: "꿈의 팝송", possibility: 0 },
  { station: "#8001", start: "04:00", end: "05:00", djName: null, program: "가요 1999", possibility: 0 },
  { station: "#8001", start: "05:00", end: "06:00", djName: null, program: "오늘의 문화방송", dayType: "weekday", possibility: 0 },
  { station: "#8001", start: "05:00", end: "06:00", djName: null, program: "가요 1999", dayType: "weekend", possibility: 0 },
  { station: "#8001", start: "06:15", end: "07:00", djName: "류수민님", program: "아침&뉴스, 류수민입니다", possibility: 0 },
  { station: "#8001", start: "06:05", end: "07:00", djName: "김경일님", program: "김경일의 물음표", dayType: "saturday", possibility: 0 },
  { station: "#8001", start: "06:05", end: "07:00", djName: "고아성님", program: "라디오 북클럽 고아성입니다", dayType: "sunday", possibility: 0 },
  { station: "#8001", start: "07:05", end: "08:00", djName: "김종배님", program: "김종배의 시선집중", possibility: 0 },
  { station: "#8001", start: "08:30", end: "09:00", djName: "이진우님", program: "이진우의 손에 잡히는 경제", dayType: "weekday", possibility: 0 },
  { station: "#8001", start: "08:05", end: "09:00", djName: "권용주님, 강다솜님", program: "권용주,강다솜의 차키차키", dayType: "weekend", possibility: 0 },
  { station: "#8001", start: "09:05", end: "11:00", djName: "양희은님, 김일중님", program: "여성시대 양희은, 김일중입니다", possibility: 0 },
  { station: "#8001", start: "11:05", end: "12:00", djName: "오승훈님", program: "오승훈의 이과학저과학", dayType: "weekday", possibility: 0 },
  { station: "#8001", start: "11:05", end: "12:00", djName: "이정민님", program: "이정민의 정치인씨", dayType: "weekend", possibility: 0 },
  { station: "#8001", start: "12:05", end: "14:00", djName: "손석희님", program: "손석희의 12시", possibility: 0 },
  { station: "#8001", start: "14:20", end: "16:00", djName: "손태진님", program: "손태진의 트로트라디오", dayType: "weekday", possibility: 0 },
  { station: "#8001", start: "14:10", end: "16:00", djName: null, program: "손태진의 트로트라디오", dayType: "weekend", possibility: 0 },
  { station: "#8001", start: "16:05", end: "18:00", djName: "정선희님, 문천식님", program: "정선희, 문천식의 지금은 라디오 시대", dayType: "weekday", possibility: 0 },
  { station: "#8001", start: "18:05", end: "20:00", djName: "김치형님", program: "김치형의 뉴스 하이킥", dayType: "weekend", possibility: 0 },
  { station: "#8001", start: "20:05", end: "22:00", djName: "이재은님", program: "오늘도 당신 편 이재은입니다", possibility: 1 },
  { station: "#8001", start: "22:05", end: "23:00", djName: "박정호님", program: "박정호의 손에 잡히는 경제 플러스", possibility: 0 },
  { station: "#8001", start: "23:05", end: "24:00", djName: "신해림님", program: "신해림의 골든디스크", possibility: 0 },
];

/** 편성표에 붙는 요일 꼬리표 */
export const DAY_TYPE_LABEL: Record<DayType, string> = {
  weekday: "평일",
  weekend: "주말",
  saturday: "토요일",
  sunday: "일요일",
  monWed: "월~수",
  thuFri: "목·금",
};

export const POSSIBILITY_LABEL: Record<Possibility, string> = {
  2: "가능성 높음",
  1: "가능성 있음",
  0: "신청 어려움",
};

/** 요일 번호(0=일) → 편성 구분 */
export function dayTypeOf(day: number): DayType {
  if (day === 6) return "saturday";
  if (day === 0) return "sunday";
  return "weekday";
}

/** 편성 구분 → 그 편성이 나가는 요일(0=일) */
const DAY_TYPE_DAYS: Record<DayType, number[]> = {
  weekday: [1, 2, 3, 4, 5],
  weekend: [0, 6],
  saturday: [6],
  sunday: [0],
  monWed: [1, 2, 3],
  thuFri: [4, 5],
};

/** 이 편성이 그 요일(0=일)에 나가는가 */
export function slotRunsOn(slot: RadioSlot, day: number): boolean {
  if (!slot.dayType) return true;
  return DAY_TYPE_DAYS[slot.dayType].includes(day);
}

/** 일주일 중 며칠 나가는 편성인가 — 적을수록 좁은 편성이다 */
function daysCovered(slot: RadioSlot): number {
  return slot.dayType ? DAY_TYPE_DAYS[slot.dayType].length : 7;
}

/**
 * 지금(KST) 이 채널에서 방송 중인 편성. 없으면 null.
 *
 * 같은 시간대에 여러 편성이 겹치면 **좁은 편성이 이긴다**(월~수 > 평일 > 매일) —
 * 넓은 편성을 "기본값", 좁은 편성을 "예외"로 적기 때문이다.
 */
export function findRadioSlot(
  station: string,
  now: Date = new Date()
): RadioSlot | null {
  const { day, minutes } = kstNow(now);

  const candidates = RADIO_SCHEDULE.filter(
    (s) =>
      s.station === station &&
      hhmmToMinutes(s.start) <= minutes &&
      minutes < hhmmToMinutes(s.end) &&
      slotRunsOn(s, day)
  );

  return (
    [...candidates].sort((a, b) => daysCovered(a) - daysCovered(b))[0] ?? null
  );
}

/** 편성표 화면용 — 채널별로 묶고 시작 시각순으로 정렬한다 */
export function scheduleOf(station: string): RadioSlot[] {
  return RADIO_SCHEDULE.filter((s) => s.station === station).sort(
    (a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start)
  );
}

/** GET /api/radio-message 의 채널 한 줄 (지금 방송 + 지금 보낼 사연) */
export type RadioNow = {
  number: string;
  program: string | null;
  djName: string | null;
  possibility: Possibility | null;
  /** 문자 본문에 채워질 사연 */
  message: string;
};

/**
 * 사연을 못 받아왔을 때 채우는 기본 문장.
 * 사연 생성은 API 라우트를 타므로 실패할 수 있는데, 그렇다고 버튼을 막으면
 * "지금 당장 신청"이라는 이 화면의 쓸모가 통째로 사라진다. 최소한의 한 줄은
 * 항상 들고 있다가 문자 앱을 열어준다.
 */
export const RADIO_DEFAULT_MESSAGE = "NCT DREAM의 Beat It Up 신청합니다!";

/**
 * 사연 팝업 · 라디오 페이지에 함께 띄우는 안내 문구.
 *
 * 자동 생성 문장은 시간대와 DJ 호칭까지만 맞춘다 — 그날 방송에서 무슨 이야기를
 * 다루는지는 알 수 없다. 주제에 얹은 한두 줄이 붙어야 실제로 읽히므로,
 * 보내기 전에 손보도록 화면에서 먼저 말해 준다.
 */
export const RADIO_MESSAGE_NOTICE =
  "당일 라디오 주제에 맞게 사연을 추가로 작성한 후 신청해주세요";
