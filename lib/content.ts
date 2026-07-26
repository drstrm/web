/*
 * 콘텐츠 데이터 레이어 (A안 CMS 시임)
 * ------------------------------------------------------------------
 * 현재는 정적 데이터를 반환하지만, 운영 단계에서는 각 함수 내부를
 * Notion API 호출로 교체합니다. 페이지 컴포넌트는 이 함수 시그니처만
 * 바라보므로, Notion 연동 시 페이지 코드는 바뀌지 않습니다.
 *
 * 예) 실제 Notion 연동 시:
 *   import { Client } from "@notionhq/client";
 *   const notion = new Client({ auth: process.env.NOTION_TOKEN });
 *   export async function getGuides() {
 *     const res = await notion.databases.query({ database_id: ... });
 *     return res.results.map(mapNotionPageToGuide);
 *   }
 *
 * ISR: 각 페이지에서 `export const revalidate = 300;` (PLAVE 레퍼런스와 동일)
 */

export type GuideStatus = "ready" | "coming-soon";

export interface GuideImage {
  /** Vercel Blob / Cloudinary 등에서 호스팅되는 원본 이미지 URL */
  src: string;
  alt: string;
}

export interface GuideItem {
  slug: string;
  title: string;
  summary?: string;
  status: GuideStatus;
  /** 클릭 시 라이트박스로 크게 보기/다운로드 (기획안 4 필수 기능) */
  images?: GuideImage[];
}

export interface GuideSection {
  id: string;
  title: string;
  items: GuideItem[];
}

/* ---------------- GUIDE: 스트리밍 가이드 ---------------- */
export function getStreamingGuides(): GuideSection[] {
  return [
    {
      id: "audio",
      title: "음원 스트리밍",
      items: [
        { slug: "melon", title: "멜론", status: "coming-soon", summary: "멜론 뮤직웨이브 스트리밍 가이드 (제작 후 업로드 예정)" },
        { slug: "genie", title: "지니", status: "coming-soon" },
        { slug: "bugs", title: "벅스", status: "coming-soon" },
        { slug: "flo", title: "플로", status: "coming-soon" },
        { slug: "spotify", title: "스포티파이", status: "coming-soon" },
        { slug: "apple-music", title: "애플뮤직", status: "coming-soon" },
        { slug: "youtube-music", title: "유튜브 뮤직", status: "coming-soon" },
      ],
    },
    {
      id: "mv",
      title: "MV 스트리밍",
      items: [{ slug: "mv", title: "MV 스트리밍 가이드", status: "coming-soon" }],
    },
    {
      id: "tools",
      title: "스트리밍 도구",
      items: [
        { slug: "station-head", title: "Station head", status: "coming-soon" },
        { slug: "music-wave", title: "Music wave", status: "coming-soon" },
        { slug: "sound-assistant", title: "Sound assistant 사용", status: "coming-soon" },
        { slug: "samsung-music", title: "삼성 뮤직 스트리밍", status: "coming-soon" },
      ],
    },
  ];
}

/* ---------------- GUIDE: 투표 ---------------- */
export function getVotingGuides(): GuideSection[] {
  return [
    {
      id: "music-show",
      title: "음악방송 투표",
      items: [
        { slug: "show-champion", title: "쇼챔피언 · 아이돌챔프", status: "coming-soon" },
        { slug: "mcountdown", title: "엠카운트다운 · 엠넷플러스", status: "coming-soon" },
        { slug: "music-bank", title: "뮤직뱅크 · 뮤빗", status: "coming-soon" },
        { slug: "inkigayo-music-core", title: "쇼 음악중심 · 뮤빗/뮤니버스", status: "coming-soon" },
        { slug: "inkigayo", title: "인기가요", status: "coming-soon" },
      ],
    },
    {
      id: "awards",
      title: "시상식 투표",
      items: [
        { slug: "awards", title: "시상식 투표 가이드", status: "coming-soon", summary: "시상식 투표 시작 시 가이드 업로드 예정" },
      ],
    },
  ];
}

/* ---------------- GUIDE: 다운로드 ---------------- */
export function getDownloadGuides(): GuideSection[] {
  return [
    {
      id: "audio-dl",
      title: "음원 다운로드",
      items: [
        { slug: "melon-dl", title: "멜론", status: "coming-soon" },
        { slug: "genie-dl", title: "지니", status: "coming-soon" },
        { slug: "bugs-dl", title: "벅스", status: "coming-soon" },
        { slug: "kams-dl", title: "카뮤", status: "coming-soon" },
      ],
    },
    {
      id: "mv-dl",
      title: "MV 다운로드",
      items: [{ slug: "mv-dl", title: "MV 다운로드 가이드", status: "coming-soon" }],
    },
  ];
}

/* ---------------- GUIDE: 기타 ---------------- */
export function getEtcGuides(): GuideSection[] {
  return [
    {
      id: "etc",
      title: "기타 가이드",
      items: [
        { slug: "coloring", title: "컬러링 · 벨소리 설정", status: "coming-soon" },
        { slug: "shortform", title: "숏폼 제작 가이드", status: "coming-soon" },
        { slug: "pass", title: "이용권 추천 가이드", status: "coming-soon" },
      ],
    },
  ];
}

/* ---------------- HOME: 실시간 차트 (X 계정과 동일) ---------------- */
export interface ChartRow {
  platform: string;
  rank: number | string;
  note?: string;
}
export function getRealtimeChart(): { updatedAt: string; rows: ChartRow[] } {
  // 운영 시: 스밍팀 X 계정에 올리는 차트 데이터 소스와 연동
  return {
    updatedAt: "업데이트 대기 중",
    rows: [
      { platform: "멜론 TOP100", rank: "—" },
      { platform: "지니", rank: "—" },
      { platform: "벅스", rank: "—" },
      { platform: "플로", rank: "—" },
      { platform: "써클차트", rank: "—" },
    ],
  };
}

/* ---------------- HOME: 캘린더 / To Do ---------------- */
export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  label: string;
  type: "debut" | "birthday" | "vote" | "chart";
}
export function getCalendarEvents(): CalendarEvent[] {
  // 컴백 관련(투표 기간/써클차트 마감)은 컴백일 확정 시 기재
  return [
    { date: "2016-08-25", label: "NCT DREAM 데뷔일", type: "debut" },
    { date: "2000-02-25", label: "마크 생일", type: "birthday" },
    { date: "2002-08-06", label: "런쥔 생일", type: "birthday" },
    { date: "2000-08-01", label: "제노 생일", type: "birthday" },
    { date: "2000-09-23", label: "해찬 생일", type: "birthday" },
    { date: "2001-06-28", label: "재민 생일", type: "birthday" },
    { date: "2002-08-05", label: "천러 생일", type: "birthday" },
    { date: "2002-03-28", label: "지성 생일", type: "birthday" },
  ];
}

export function getTodoList(): { label: string; done?: boolean }[] {
  // 컴백 기간 동안 매일 해야 하는 투표/스밍 (컴백일 확정 시 활성화)
  return [
    { label: "멜론 24시간 스트리밍 돌리기" },
    { label: "유튜브 MV 시청 (로그인 상태)" },
    { label: "음악방송 사전투표 참여" },
    { label: "실시간 문자투표 (쇼! 음악중심 #0505)" },
  ];
}

/* ---------------- HOME: 유튜브 MV ---------------- */
export interface MvStat {
  title: string;
  youtubeId: string;
  views?: string;
  likes?: string;
}
export function getMvStats(): MvStat[] {
  // 운영 시: YouTube Data API로 조회수/좋아요 갱신 (ISR)
  return [
    { title: "최신 MV", youtubeId: "", views: "—", likes: "—" },
  ];
}

/* ---------------- HOME: 앨범 사전판매 정리 ---------------- */
export interface PreorderShop {
  name: string;
  href: string;
  kind: "앨범사" | "팬덤공구";
}
export function getPreorderShops(): PreorderShop[] {
  // 사전예약판매 시작 시 업데이트 (공구주 동의 후)
  return [];
}
