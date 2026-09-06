/*
 * 콘텐츠 데이터 레이어 (A안 CMS 시임)
 * ------------------------------------------------------------------
 * 가이드 · 일정 · 할일 모두 노션 DB 에서 읽는다(lib/notion.ts).
 * 페이지 컴포넌트는 이 파일의 함수 시그니처만 바라본다.
 *
 * 조회에 실패해도 페이지 전체를 죽이지 않고 해당 섹션만 비운다.
 * 가이드가 잠깐 안 보이는 것이, 사이트가 500 을 뱉는 것보다 낫다.
 *
 * ISR: 각 페이지에서 `export const revalidate = 300;` (PLAVE 레퍼런스와 동일)
 */

import {
  getBanners as getNotionBanners,
  getFormLinks as getNotionFormLinks,
  getGuideSections,
  getQuickLinks as getNotionQuickLinks,
  getSchedules as getNotionSchedules,
  getStreamingLists as getNotionStreamingLists,
  SLUG_ID_LENGTH,
  type GuidePage,
  type NotionBanner,
  type NotionSchedule,
} from "@/lib/notion";
import type { ActiveVote } from "@/lib/votes";

export type { GuidePage };

/* ---------------- HOME: 슬라이드 배너 (노션 DB) ---------------- */

export type Banner = NotionBanner;

/**
 * 홈 배너 조회. 이미지 · 링크 · 문구 · 순서를 전부 노션에서 읽는다
 * (스키마는 docs/notion-banner-db.md).
 *
 * 조회에 실패하면 배너 영역만 비운다 — 홈이 500 이 되는 것보다 낫다.
 */
export async function getBanners(): Promise<Banner[]> {
  try {
    return await getNotionBanners();
  } catch (e) {
    console.error("[banners] 노션 조회 실패:", e);
    return [];
  }
}

/* ---------------- HOME: 바로가기 아이콘 (노션 DB) ---------------- */

export interface QuickLink {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  key: string;
  label: string;
  /** 노션 `emoji` 열. 비어 있으면 🔗 */
  emoji: string;
  /** 내부 경로(`/oneclick/voting`) 또는 외부 주소. 새 탭 여부는 <SmartLink> 가 정한다 */
  href: string;
}

/**
 * 홈 바로가기 아이콘 조회 (스키마는 docs/notion-links-db.md).
 * 조회에 실패하면 바로가기 영역만 비운다 — 헤더 내비게이션으로도 같은 곳에
 * 갈 수 있으므로, 홈이 500 이 되는 것보다 낫다.
 */
export async function getQuickLinks(): Promise<QuickLink[]> {
  try {
    return await getNotionQuickLinks();
  } catch (e) {
    console.error("[quick-links] 노션 조회 실패:", e);
    return [];
  }
}

export type GuideStatus = "ready" | "coming-soon";

export interface GuideImage {
  /**
   * 이미지 프록시 주소 (`/api/guide-image?p=…&i=…&v=…`).
   * 노션의 S3 서명 URL 은 1시간 뒤 만료되므로 클라이언트에 직접 내보내지 않는다.
   * `v` 는 이미지가 교체될 때만 바뀌는 버전 토큰이다. 자세한 내용은 lib/notion.ts
   */
  src: string;
  alt: string;
}

export interface GuideItem {
  /** 상세 페이지 주소 조각 (`/guide/<page>/<slug>`). 생성 규칙은 lib/notion.ts */
  slug: string;
  title: string;
  summary?: string;
  status: GuideStatus;
  /** 상세 페이지에서 화면 폭에 꽉 차게 표시 · 저장 (기획안 4 필수 기능) */
  images?: GuideImage[];
  /**
   * 이 가이드에서 쓰는 플랫폼 아이콘 키 (public/icons/<key>.png).
   * 한 가이드가 앱 여러 개를 다루면 여러 개를 넣는다. 목록은 lib/platform-icons.ts
   */
  iconTypes?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  items: GuideItem[];
}

/* ---------------- GUIDE (노션 DB) ---------------- */

/**
 * 가이드 섹션 조회.
 *
 * 운영진이 노션에서 행을 추가 · 수정 · 공개하면 ISR 주기(300초) 안에 반영된다.
 * 항목이 하나도 없는 섹션은 lib/notion.ts 에서 걸러지므로,
 * 아직 아무것도 안 올린 페이지는 빈 배열이 된다.
 */
async function getGuides(page: GuidePage): Promise<GuideSection[]> {
  try {
    return await getGuideSections(page);
  } catch (e) {
    // 조회 실패 시 해당 페이지의 목록만 비우고 페이지는 정상 렌더한다.
    console.error(`[guides] 노션 조회 실패 (page=${page}):`, e);
    return [];
  }
}

export const getStreamingGuides = () => getGuides("streaming");
export const getIdGenerateGuides = () => getGuides("id-generate");
export const getVotingGuides = () => getGuides("voting");
export const getDownloadGuides = () => getGuides("download");
export const getEtcGuides = () => getGuides("etc");

/**
 * 가이드 카테고리 정보.
 * 가이드 허브(/guide)의 카드, 각 목록 페이지의 헤더, 상세 페이지의 「목록으로」
 * 링크가 모두 여기를 본다 — 문구를 한 군데서만 고치면 된다.
 *
 * 아이콘은 여기 두지 않는다. href 로 lib/nav-icons.ts 에서 찾으므로 헤더 ·
 * 모바일 메뉴 · 허브 카드가 저절로 같은 그림을 쓴다.
 */
export interface GuidePageInfo {
  page: GuidePage;
  href: string;
  /** 페이지 제목 (허브 카드 · 헤더 · <title>) */
  title: string;
  /** 허브 카드의 한 줄 설명 */
  summary: string;
  /** 목록 페이지 헤더의 설명 */
  description: string;
}

export const GUIDE_PAGES: GuidePageInfo[] = [
  {
    page: "streaming",
    href: "/guide/streaming",
    title: "스트리밍 가이드",
    summary: "멜론·지니·벅스·플로·스포티파이 등 플랫폼별 음원/MV 스트리밍",
    description: "플랫폼을 고르면 가이드 이미지를 크게 볼 수 있어요.",
  },
  {
    page: "id-generate",
    href: "/guide/id-generate",
    title: "아이디 생성 가이드",
    summary: "멜론·지니·벅스·플로·바이브 등 플랫폼별 계정 만들기",
    description: "플랫폼별 아이디 만드는 방법입니다. 스밍 전에 계정부터 준비해 주세요.",
  },
  {
    page: "voting",
    href: "/guide/voting",
    title: "투표 가이드",
    summary: "음악방송 · 시상식 투표 앱 가이드",
    description: "방송사별 음악방송 투표 앱과 시상식 투표 방법을 안내합니다.",
  },
  {
    page: "download",
    href: "/guide/download",
    title: "다운로드 가이드",
    summary: "플랫폼별 음원 · MV 다운로드",
    description: "플랫폼을 고르면 가이드 이미지를 크게 볼 수 있어요.",
  },
  {
    page: "etc",
    href: "/guide/etc",
    title: "기타 가이드",
    summary: "컬러링·벨 설정, 숏폼 제작, 이용권 추천",
    description: "컬러링·벨 설정, 숏폼 제작, 이용권 추천 가이드입니다.",
  },
];

export const getGuidePageInfo = (page: GuidePage): GuidePageInfo =>
  GUIDE_PAGES.find((p) => p.page === page)!;

/** 상세 페이지가 필요로 하는 한 항목과, 그 항목이 속한 섹션 */
export interface GuideEntry {
  section: GuideSection;
  item: GuideItem;
}

/**
 * 슬러그 끝에 붙은 노션 id 조각(lib/notion.ts).
 * 슬러그 형태가 아니면 빈 문자열 — 엉뚱한 값이 넓게 매칭되지 않게 한다.
 */
function slugIdTail(slug: string): string {
  const tail = slug.slice(slug.lastIndexOf("-") + 1);
  return tail.length === SLUG_ID_LENGTH ? tail : "";
}

/**
 * 상세 페이지용 단일 가이드 조회. 없으면 null (호출부에서 notFound()).
 *
 * 제목이 바뀌면 슬러그 앞부분도 바뀌므로, 정확히 일치하는 항목이 없으면
 * 끝의 id 조각으로 한 번 더 찾는다 — 이미 공유된 링크가 제목 수정만으로
 * 죽지 않도록 하기 위해서다.
 */
export async function getGuideEntry(
  page: GuidePage,
  slug: string,
): Promise<GuideEntry | null> {
  const sections = await getGuides(page);
  const entries = sections.flatMap((section) =>
    section.items.map((item) => ({ section, item })),
  );

  const exact = entries.find((e) => e.item.slug === slug);
  if (exact) return exact;

  const tail = slugIdTail(slug);
  return (tail && entries.find((e) => slugIdTail(e.item.slug) === tail)) || null;
}

/* ---------------- ONECLICK: 스밍리스트 (노션 DB) ---------------- */

/** 한 플랫폼 안에서 같은 링크를 쓰는 기기 묶음 */
export interface StreamingTarget {
  /**
   * 운영체제 · 기기 (안드로이드 / iOS / 아이패드 / PC).
   * 링크가 같은 기기끼리 한 줄로 묶여 있다 (플로 = 안드로이드 · iOS).
   */
  os: string[];
  /** 링크가 여러 개면 노션 `순서` 열대로 1, 2, 3… */
  links: string[];
}

export interface StreamingList {
  platform: string;
  /** public/icons/<key>.png 의 key. 아이콘이 없는 플랫폼은 비어 있다 */
  iconType?: string;
  targets: StreamingTarget[];
}

/**
 * 스밍리스트 원클릭 조회 (스키마는 docs/notion-streaming-db.md).
 * 조회에 실패하면 목록만 비운다 — 페이지가 500 이 되는 것보다 낫다.
 */
export async function getStreamingLists(): Promise<StreamingList[]> {
  try {
    return await getNotionStreamingLists();
  } catch (e) {
    console.error("[streaming-lists] 노션 조회 실패:", e);
    return [];
  }
}

/* ---------------- FORM · HELPER (노션 DB) ---------------- */

/** 폼 목록이 나뉘는 두 페이지 (= /community/forms · /community/helper) */
export type FormKind = "form" | "helper";

/**
 * 폼 하나의 상태.
 *  - open      신청 가능 (링크가 열린다)
 *  - closed    마감 (남겨두되 누를 수 없다)
 *  - upcoming  준비 중 · 링크가 아직 없음
 */
export type FormStatus = "open" | "closed" | "upcoming";

export interface FormLink {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  key: string;
  title: string;
  summary?: string;
  /** 신청 폼 주소. 마감 · 준비 중이면 비어 있다 */
  href?: string;
  status: FormStatus;
  /** 접수 기간 표기 (자유 텍스트 — "~ 8/24 23:59") */
  period?: string;
  /** 노션 `emoji` 열. 비어 있으면 페이지 기본 이모지 */
  emoji?: string;
}

/** 폼 · 헬퍼 페이지의 고정 문구. 두 페이지가 이 값만 바꿔 쓴다 */
export interface FormPageInfo {
  kind: FormKind;
  href: string;
  /** 페이지 제목 (헤더 · <title>) */
  title: string;
  description: string;
  /** 목록이 비었을 때(아직 없거나 조회 실패) 보여줄 문구 */
  empty: string;
}

export const FORM_PAGES: Record<FormKind, FormPageInfo> = {
  form: {
    kind: "form",
    href: "/community/forms",
    title: "폼 바로가기",
    description: "스밍팀에서 진행 중인 신청 · 설문 폼을 한곳에 모았어요.",
    empty: "진행 중인 폼이 없어요",
  },
  helper: {
    kind: "helper",
    href: "/community/helper",
    title: "헬퍼 신청하기",
    description: "총공 · 이벤트를 함께 준비할 헬퍼를 모집하는 폼입니다.",
    empty: "모집 중인 헬퍼 폼이 없어요",
  },
};

/**
 * 폼 · 헬퍼 목록 조회 (스키마는 docs/notion-forms-db.md).
 *
 * 한 노션 DB 를 `구분`(폼 · 헬퍼) 열로 나눠 두 페이지가 나눠 쓴다.
 * 조회에 실패하거나 DB 를 아직 안 만들었으면 목록만 비운다 —
 * 페이지는 「준비 중」 안내와 함께 정상 렌더된다.
 */
export async function getFormLinks(kind: FormKind): Promise<FormLink[]> {
  try {
    return await getNotionFormLinks(kind);
  } catch (e) {
    console.error(`[form-links] 노션 조회 실패 (kind=${kind}):`, e);
    return [];
  }
}

/* ---------------- HOME: 실시간 차트 (X 계정과 동일) ---------------- */
export interface ChartRow {
  platform: string;
  /** public/icons/<key>.png 의 key. 아이콘이 없는 플랫폼은 비어 있다 */
  iconType?: string;
  rank: number | string;
  note?: string;
}
export function getRealtimeChart(): { updatedAt: string; rows: ChartRow[] } {
  // 운영 시: 스밍팀 X 계정에 올리는 차트 데이터 소스와 연동
  return {
    updatedAt: "업데이트 대기 중",
    rows: [
      { platform: "멜론 TOP100", iconType: "melon", rank: "—" },
      { platform: "멜론 HOT100", iconType: "melon", rank: "—" },
      { platform: "지니", iconType: "genie", rank: "—" },
      { platform: "벅스", iconType: "bugs", rank: "—" },
      { platform: "플로", iconType: "flo", rank: "—" },
      { platform: "바이브", iconType: "vibe", rank: "—" },
    ],
  };
}

/* ---------------- 공용 일정 DB (노션) ---------------- */

/**
 * 화면(surface) 하나에 나갈 일정만 골라 온다.
 * @param surface    노션 `노출 위치` 값 (calendar · todo · vote)
 * @param revalidate 노션 조회 캐시(초)
 *
 * 홈이 캘린더 · To Do 를 병렬로 불러도 노션 왕복은 한 번이다 — 같은 조회라
 * Next 의 fetch 캐시가 하나로 합친다. 투표만 주기가 짧아 따로 한 벌을 더 쓴다.
 */
async function getSchedules(
  surface: string,
  revalidate?: number,
): Promise<NotionSchedule[]> {
  try {
    const rows = await getNotionSchedules(revalidate);
    return rows.filter((r) => r.surfaces.includes(surface));
  } catch (e) {
    // 조회 실패 시 해당 섹션만 비우고 페이지는 정상 렌더한다.
    console.error(`[schedules] 노션 조회 실패 (surface=${surface}):`, e);
    return [];
  }
}

/**
 * 지금 이 시각에 기간이 열려 있는가.
 * 시작을 안 적었으면 이미 시작한 것으로, 끝을 안 적었으면 안 끝나는 것으로 본다.
 */
const isOngoing = (r: NotionSchedule, now: number) =>
  (r.startMs === null || r.startMs <= now) && (r.endMs === null || r.endMs > now);

/**
 * 마감 임박 순 정렬용 키. 기한이 없는 상시 할일은 맨 뒤로 보낸다.
 * MAX_SAFE_INTEGER 로 두면 상시끼리 뺐을 때 0 이라, Infinity 와 달리 NaN 이 안 난다.
 */
const deadlineRank = (r: NotionSchedule) => r.endMs ?? Number.MAX_SAFE_INTEGER;

/* ---------------- HOME: 캘린더 ---------------- */
export interface CalendarEvent {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  id: string;
  /** 시작일 YYYY-MM-DD (KST). recurring 일정은 연도를 무시하고 월-일만 사용 */
  date: string;
  /** 기간 일정의 종료일. 없으면 하루짜리 일정 */
  endDate?: string;
  label: string;
  /** 노션 `종류` — 이모지 매핑에 사용 */
  type: string;
  /** 데뷔일 · 생일처럼 매년 반복되는 기념일 여부 */
  recurring: boolean;
  /** 운영진이 지정한 이모지 (없으면 kind 기본값) */
  emoji?: string;
  /** 플랫폼 아이콘 키. 아이콘이 있으면 이모지 대신 표시 */
  iconType?: string;
  url?: string;
}

/**
 * 홈 캘린더 일정 조회.
 * 컴백 관련 일정(투표 기간 · 써클차트 마감)도 코드 배포 없이 노션에서 추가한다.
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const rows = await getSchedules("calendar");

  return rows.flatMap((r) =>
    // 기간을 안 적은 일정은 달력에 놓을 자리가 없다 (To Do 에는 상시 할일로 나온다)
    r.startDate === null
      ? []
      : [
          {
            id: r.id,
            date: r.startDate,
            ...(r.endDate ? { endDate: r.endDate } : {}),
            label: r.title,
            type: r.kind,
            recurring: r.recurringYearly,
            ...(r.emoji ? { emoji: r.emoji } : {}),
            ...(r.iconType ? { iconType: r.iconType } : {}),
            ...(r.url ? { url: r.url } : {}),
          },
        ],
  );
}

/* ---------------- HOME: To Do ---------------- */
export interface TodoItem {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  id: string;
  label: string;
  description?: string;
  /** 바로가기 링크 (투표 · 스밍) */
  url?: string;
  /** 관련 가이드 페이지 */
  guideUrl?: string;
  /** 플랫폼 아이콘 키 */
  iconType?: string;
  emoji?: string;
  kind: string;
  /** 마감 시각. 없으면 기한 없는 할일 */
  endsAt?: string;
  /** 노션에 시각 없이 날짜만 적은 일정 — 마감 표시에서 시각을 뗀다 */
  allDay: boolean;
  /** 기간 내내 매일 해야 하는 할일 — 마감 대신 「매일」로 표시 */
  daily: boolean;
}

/**
 * 지금 진행중인 할일 조회 (`노출 위치` 에 todo 가 있는 일정).
 *
 * 기간 판단은 노션 `기간` 열로만 한다. 「지금」은 렌더 시점에 계산하므로 정확도의
 * 상한은 페이지 ISR 주기(300초)다 — 마감 직후 몇 분간은 끝난 할일이 남아 보인다.
 *
 * 정렬은 `순서` 열 → 마감 임박 순. `순서` 열이 없으면(현재 상태) 값이 전부 같아서
 * 사실상 마감 임박 순이 된다 — 오늘 안에 해야 하는 일이 위로 올라온다.
 */
export async function getTodoList(): Promise<TodoItem[]> {
  const rows = await getSchedules("todo");
  const now = Date.now();

  return rows
    .filter((r) => isOngoing(r, now))
    .sort((a, b) => a.order - b.order || deadlineRank(a) - deadlineRank(b))
    .map((r) => ({
      id: r.id,
      label: r.title,
      ...(r.description ? { description: r.description } : {}),
      ...(r.url ? { url: r.url } : {}),
      ...(r.guideUrl ? { guideUrl: r.guideUrl } : {}),
      ...(r.iconType ? { iconType: r.iconType } : {}),
      ...(r.emoji ? { emoji: r.emoji } : {}),
      kind: r.kind,
      ...(r.endsAt ? { endsAt: r.endsAt } : {}),
      allDay: r.allDay,
      daily: r.daily,
    }));
}

/* ---------------- ONECLICK: 진행중 투표 ---------------- */

/**
 * 지금 열려 있는 투표 (`노출 위치` 에 vote 가 있는 일정). 마감이 빠른 순.
 *
 * **서버에서만 부른다** (app/api/votes). 노션 토큰은 서버 전용이라 투표 버튼
 * (components/VoteApps.tsx)이 노션을 직접 부를 수 없어서, 라우트가 한 겹 선다.
 */
export async function getActiveVotes(): Promise<ActiveVote[]> {
  // 투표는 열리고 닫히는 순간이 중요하다. 홈(300초)보다 짧게 잡는다.
  const rows = await getSchedules("vote", 60);
  const now = Date.now();

  const open = rows.flatMap((r) => {
    // 링크 · 아이콘 · 기간이 다 있어야 「투표하기」 버튼이 성립한다
    if (!r.url || !r.iconType || !r.startsAt || !r.endsAt) return [];
    if (!isOngoing(r, now)) return [];

    return [
      {
        endMs: r.endMs ?? Number.MAX_SAFE_INTEGER,
        vote: {
          id: r.id,
          title: r.title,
          url: r.url,
          iconType: r.iconType,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
          allDay: r.allDay,
        } satisfies ActiveVote,
      },
    ];
  });

  // 같은 앱에 여러 건이 걸리면 화면이 첫 건을 쓴다 — 마감이 빠른 쪽을 앞에 둔다
  return open.sort((a, b) => a.endMs - b.endMs).map((o) => o.vote);
}

/* ---------------- HOME: 유튜브 MV ---------------- */
export interface MvStat {
  title: string;
  /** 전체 URL 이 아니라 영상 id — youtube.com/watch?v= 뒤에 붙는 그 토막 */
  youtubeId: string;
  /** 값이 도착하기 전 · 조회 실패 시의 표시값 */
  views?: string;
  likes?: string;
}

/*
 * 여기서 정하는 건 "어떤 영상을 걸 것인가" 뿐이다.
 *
 * 조회수 · 좋아요는 접속 · 새로고침마다 /api/mv-stats 가 유튜브 watch 페이지에서
 * 새로 긁어 덮어쓴다(lib/youtube.ts · components/MvCard.tsx). 아래 "—" 는 그 값이
 * 도착하기 전과 조회에 실패했을 때 남는 자리표시다.
 */
export function getMvStats(): MvStat[] {
  return [
    { title: "최신 MV", youtubeId: "wvtNmMmcAYw", views: "—", likes: "—" },
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
