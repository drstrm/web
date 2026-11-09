/*
 * 콘텐츠 데이터 레이어 (A안 CMS 시임)
 * ------------------------------------------------------------------
 * 가이드 · 일정 · 할일은 노션 DB(lib/notion.ts), 실시간 차트는 수집기가 쌓는
 * 수파베이스(lib/supabase.ts)에서 읽는다. 페이지 컴포넌트는 이 파일의 함수
 * 시그니처만 바라본다 — 어느 저장소에서 오는지는 여기서 끝난다.
 *
 * 조회에 실패해도 페이지 전체를 죽이지 않고 해당 섹션만 비운다.
 * 가이드가 잠깐 안 보이는 것이, 사이트가 500 을 뱉는 것보다 낫다.
 *
 * ISR: 각 페이지에서 `export const revalidate = 300;` (PLAVE 레퍼런스와 동일)
 *
 * ── 언어 ───────────────────────────────────────────────────────
 * 노션 콘텐츠도 언어별로 나간다 (`설명` / `설명_EN`). 어느 언어인지는 **페이지가
 * 넘겨주지 않는다** — 각 페이지가 이미 `setRequestLocale(locale)` 을 부르고 있어서
 * next-intl 의 getLocale() 이 같은 값을 준다. 호출부를 하나도 고치지 않고(=
 * 새 화면이 규칙을 하나 더 외우지 않고) 언어가 흘러가는 지점이다.
 *
 * 번역이 비어 있으면 한국어가 나온다 (lib/notion.ts 의 localized()).
 */

import {
  getAlbumBenefits as getNotionAlbumBenefits,
  getAlbumShops as getNotionAlbumShops,
  getBanners as getNotionBanners,
  getFormLinks as getNotionFormLinks,
  getGroupOrders as getNotionGroupOrders,
  getGuideSections,
  getQuickLinks as getNotionQuickLinks,
  getSchedules as getNotionSchedules,
  getStreamingLists as getNotionStreamingLists,
  SLUG_ID_LENGTH,
  type GuidePage,
  type NotionBanner,
  type NotionSchedule,
} from "@/lib/notion";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { mayShowInTodo } from "@/lib/todo";
import { CHART_TRACK } from "@/lib/site";
import { type ChartRun, getLatestChart } from "@/lib/supabase";
import type { ActiveVote } from "@/lib/votes";

export type { GuidePage };

/**
 * 이 요청의 언어. 노션 조회에 그대로 넘긴다.
 *
 * 서버 컴포넌트에서는 페이지가 부른 setRequestLocale() 값이 그대로 온다 (정적
 * 렌더가 유지된다 — 헤더를 읽지 않기 때문이다). 라우트 핸들러처럼 그 문맥이
 * 없는 곳에서는 던지므로 한국어로 떨어뜨린다 — 그쪽은 언어를 인자로 받는다
 * (getActiveVotes).
 */
async function requestLocale(): Promise<string> {
  try {
    return await getLocale();
  } catch {
    return routing.defaultLocale;
  }
}

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
    return await getNotionBanners(await requestLocale());
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
    return await getNotionQuickLinks(await requestLocale());
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
    return await getGuideSections(page, await requestLocale());
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
 * 링크가 모두 여기를 본다.
 *
 * 문구(제목 · 요약 · 설명)는 여기 없다 — messages 의 `guide.<page>.{title,summary,
 * description}` 에 있다. 화면이 t() 로 꺼내므로 언어별로 갈린다.
 *
 * 아이콘은 여기 두지 않는다. href 로 lib/nav-icons.ts 에서 찾으므로 헤더 ·
 * 모바일 메뉴 · 허브 카드가 저절로 같은 그림을 쓴다.
 */
export interface GuidePageInfo {
  page: GuidePage;
  href: string;
}

export const GUIDE_PAGES: GuidePageInfo[] = [
  { page: "streaming", href: "/guide/streaming" },
  { page: "id-generate", href: "/guide/id-generate" },
  { page: "voting", href: "/guide/voting" },
  { page: "download", href: "/guide/download" },
  { page: "etc", href: "/guide/etc" },
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
 *
 * 번역 대상이 없다 — 이 DB 는 `플랫폼` · `운영체제` Select 와 링크뿐이고,
 * 그 값들은 코드가 아이콘 · 표기에 쓰는 **매칭 키**다 (docs/i18n.md).
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

/**
 * 폼 · 헬퍼 페이지 정보. 두 페이지가 이 값만 바꿔 쓴다.
 *
 * 문구(제목 · 설명 · 빈 목록 안내)는 messages 의 `form.<kind>.{title,description,
 * empty}` 에 있다.
 */
export interface FormPageInfo {
  kind: FormKind;
  href: string;
}

export const FORM_PAGES: Record<FormKind, FormPageInfo> = {
  form: { kind: "form", href: "/community/forms" },
  helper: { kind: "helper", href: "/community/helper" },
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
    return await getNotionFormLinks(kind, await requestLocale());
  } catch (e) {
    console.error(`[form-links] 노션 조회 실패 (kind=${kind}):`, e);
    return [];
  }
}

/* ---------------- HOME: 실시간 차트 (수파베이스) ---------------- */
export interface ChartRow {
  platform: string;
  /** public/icons/<key>.png 의 key. 아이콘이 없는 플랫폼은 비어 있다 */
  iconType?: string;
  rank: number | string;
  note?: string;
}

/** 순위가 아직 없는 자리. 화면이 이 값을 보고 옅게 그린다 (app/[locale]/page.tsx) */
const NO_RANK = "—";

/**
 * 차트 조회 캐시(초).
 *
 * ⚠ 이 값이 **홈의 ISR 주기까지 끌어내린다** — 라우트의 유효 revalidate 는 세그먼트
 *   설정과 fetch 들의 최솟값이다. 그래서 홈의 `revalidate` 보다 짧게 두면 안 된다.
 *   수집기가 매시 4분에 한 번 돌므로(chart-bot 의 `cron_minute`) 분 단위로 조여도
 *   얻을 것이 없다. 더 자주 갱신해야 하면 투표처럼 라우트 핸들러 + 클라이언트
 *   폴링으로 빼는 쪽이 맞다 (app/api/votes · components/VoteApps.tsx 가 그 구조다).
 */
export const CHART_REVALIDATE = 300;

/**
 * 화면에 세우는 줄. 키 · 이름 · 순서를 **수집기와 맞춘다**
 * (chart-bot 의 `formatter.SOURCE_ORDER` · `SOURCE_NAMES`).
 *
 * 줄을 DB 에서 만들지 않는 이유: **데이터가 없어도 목록은 보여야** 한다. 무엇을
 * 추적하는지가 먼저 보이고, 순위 자리의 "—" 로 「아직 안 들어왔다」가 읽힌다.
 *
 * 플랫폼 이름은 **한국어 그대로** 둔다 — 화면 표기는 렌더 지점에서 고른다
 * (lib/proper-nouns.ts 의 properNoun).
 */
const CHART_PLATFORMS: { source: string; platform: string; iconType: string }[] = [
  { source: "melon_top", platform: "멜론 TOP100", iconType: "melon" },
  { source: "melon_hot100", platform: "멜론 HOT100(100일)", iconType: "melon" },
  { source: "melon_hot30", platform: "멜론 HOT100(30일)", iconType: "melon" },
  { source: "melon_realtime", platform: "멜론 실시간", iconType: "melon" },
  { source: "genie", platform: "지니", iconType: "genie" },
  { source: "flo", platform: "플로", iconType: "flo" },
  { source: "bugs", platform: "벅스", iconType: "bugs" },
  { source: "vibe", platform: "바이브 일간", iconType: "vibe" },
];

/**
 * 홈 실시간 차트 — **가장 최근 수집 한 벌**.
 *
 * 한 수집(run)이 잡은 줄만 쓴다. 플랫폼별로 최신 줄을 따로 고르면 서로 다른 시각의
 * 순위가 한 화면에 섞여서 「몇 시 기준 차트」라고 말할 수 없게 된다 (lib/supabase.ts).
 *
 * 조회에 실패하면 줄은 그대로 두고 순위만 "—" 가 된다 — 홈이 500 이 되는 것보다 낫다
 * (노션 조회 함수들과 같은 규칙).
 */
export async function getRealtimeChart(): Promise<{ updatedAt: string; rows: ChartRow[] }> {
  let run: ChartRun | null = null;
  try {
    run = await getLatestChart({ ...CHART_TRACK, revalidate: CHART_REVALIDATE });
  } catch (e) {
    console.error("[chart] 수파베이스 조회 실패:", e);
  }

  const entries = run?.entries ?? [];
  const bySource = new Map(entries.map((entry) => [entry.source, entry]));

  const rows: ChartRow[] = CHART_PLATFORMS.map(({ source, platform, iconType }) => ({
    platform,
    iconType,
    rank: bySource.get(source)?.rank ?? NO_RANK,
  }));

  /*
   * 목록에 없는 source 는 버리지 않고 뒤에 붙인다. 수집기가 차트를 늘렸을 때 화면에서
   * 조용히 사라지는 것보다, 이름이 키로 보이더라도 순위가 뜨는 쪽이 낫다 — 경고를
   * 보고 CHART_PLATFORMS 에 한 줄 추가하면 제자리로 간다.
   */
  for (const entry of entries) {
    if (CHART_PLATFORMS.some((platform) => platform.source === entry.source)) continue;
    console.warn(
      `[chart] 모르는 source "${entry.source}" — 이름 · 아이콘 없이 맨 뒤에 붙입니다 ` +
        "(lib/content.ts 의 CHART_PLATFORMS 에 추가하세요)",
    );
    rows.push({ platform: entry.source, rank: entry.rank });
  }

  /*
   * 기준 시각은 그 수집의 chart_hour 를 **그대로** 넘긴다 (표기는 렌더 지점에서 —
   * lib/datetime.ts 의 formatChartHour). 비어 있으면 화면이 「업데이트 대기 중」을 쓴다.
   */
  return { updatedAt: run?.chartHour ?? "", rows };
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
  opts: { locale?: string; revalidate?: number } = {},
): Promise<NotionSchedule[]> {
  try {
    const locale = opts.locale ?? (await requestLocale());
    const rows = await getNotionSchedules(locale, opts.revalidate);
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

/*
 * 「오늘 할 일」 노출 규칙은 lib/todo.ts 의 showsInTodo 에 있다. 「오늘」이 보는
 * 사람의 시간대에 따라 달라서 서버는 후보만 고르고(mayShowInTodo) 화면이 마저 거른다.
 *
 * ⚠ 투표(getActiveVotes)는 이 규칙을 쓰지 않는다. 시작 전 투표를 미리 띄우면
 *   「지금 투표할 수 있다」는 **잘못된 안내**가 된다 — 그쪽은 isOngoing 그대로다.
 */

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
  /**
   * 시작 시각. 아직 시작하지 않은 할일은 마감 대신 **이것**을 보여준다
   * (lib/todo.ts 의 deadline). 오늘 목록에는 시작 전 할일도 올라오기 때문이다.
   */
  startsAt?: string;
  /**
   * 기간 판정 · 시각 표시용 절대시각(ms). 없으면 그쪽 끝이 열려 있다.
   * 하루 종일 일정은 한국 자정 기준이고, 끝은 마지막 날의 **다음 날 자정**이다.
   */
  startMs?: number;
  endMs?: number;
  /** 노션에 시각 없이 날짜만 적은 일정 (= 한국 날짜 기준 하루 종일) */
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
export async function getTodoList(): Promise<{ todos: TodoItem[]; renderedAt: number }> {
  const rows = await getSchedules("todo");
  /*
   * 렌더 시각을 같이 내려 준다. 서버 HTML 과 브라우저의 첫 렌더가 **같은 시각**으로
   * 걸러야 하이드레이션이 어긋나지 않는다 (붙은 뒤에 브라우저 시각으로 다시 거른다).
   */
  const renderedAt = Date.now();

  const todos = rows
    .filter((r) => mayShowInTodo(toRange(r), renderedAt))
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
      ...(r.startsAt ? { startsAt: r.startsAt } : {}),
      ...(r.endsAt ? { endsAt: r.endsAt } : {}),
      ...toRange(r),
      daily: r.daily,
    }));

  return { todos, renderedAt };
}

/** 노션 행 → 판정용 범위 (null 은 키째 뺀다 — 화면으로 넘어가는 값이라 짧게) */
const toRange = (r: NotionSchedule) => ({
  ...(r.startMs !== null ? { startMs: r.startMs } : {}),
  ...(r.endMs !== null ? { endMs: r.endMs } : {}),
  allDay: r.allDay,
});

/* ---------------- ONECLICK: 진행중 투표 ---------------- */

/**
 * 지금 열려 있는 투표 (`노출 위치` 에 vote 가 있는 일정). 마감이 빠른 순.
 *
 * **서버에서만 부른다** (app/api/votes). 노션 토큰은 서버 전용이라 투표 버튼
 * (components/VoteApps.tsx)이 노션을 직접 부를 수 없어서, 라우트가 한 겹 선다.
 *
 * 언어를 **인자로 받는다.** 라우트 핸들러에는 `[locale]` 세그먼트가 없어서
 * (proxy.ts 가 /api 를 접두어에서 제외한다) getLocale() 이 한국어로 떨어진다 —
 * 그러면 영어판 화면의 투표 카드만 한국어가 된다. 브라우저가 `?locale=` 로 알려준다.
 */
export async function getActiveVotes(locale?: string): Promise<ActiveVote[]> {
  // 투표는 열리고 닫히는 순간이 중요하다. 홈(300초)보다 짧게 잡는다.
  const rows = await getSchedules("vote", {
    ...(locale ? { locale } : {}),
    revalidate: 60,
  });
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

  // 같은 앱에 여러 건이 열릴 수 있다. 화면이 건마다 카드 한 장을 놓으므로 전부 내려준다
  return open.sort((a, b) => a.endMs - b.endMs).map((o) => o.vote);
}

/* ---------------- HOME: 유튜브 MV ---------------- */
export interface MvStat {
  /** 제목 번역 키 (messages 의 `mv.<키>`). 화면이 t() 로 푼다 */
  titleKey: string;
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
    // https://youtu.be/LFbU0A1-IH8
    // 제목은 messages 의 `mv.latest` — 화면(MvCard)이 t() 로 꺼낸다
    { titleKey: "latest", youtubeId: "LFbU0A1-IH8", views: "—", likes: "—" },
  ];
}

/* ---------------- ALBUM: 버전 · 특전 (노션 DB) ---------------- */

/** 「앨범 버전 · 특전」 표의 한 줄 */
export interface AlbumBenefit {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  key: string;
  /** 버전 이름. 「전 버전 공통」처럼 버전이 아닌 줄도 그대로 온다 */
  version: string;
  /** 추가 특전. 노션 `추가 특전` 칸의 줄마다 하나씩 */
  benefits: string[];
  /** 비고 — 「세트 구매 가능」 · 「SMTOWN &STORE · Berriz 한정」 */
  note?: string;
}

/**
 * 버전 · 특전 표 조회 (스키마는 docs/notion-album-db.md).
 * 조회에 실패하면 표만 비운다 — 아래 앨범사 링크는 그대로 보인다.
 */
export async function getAlbumBenefits(): Promise<AlbumBenefit[]> {
  try {
    return await getNotionAlbumBenefits(await requestLocale());
  } catch (e) {
    console.error("[album-benefits] 노션 조회 실패:", e);
    return [];
  }
}

/* ---------------- ALBUM: 앨범사 예약판매 링크 (노션 DB) ---------------- */

/** 한 판매처 안의 버전 링크 하나 */
export interface AlbumShopLink {
  /** 버전 표기 (`Photobook Ver.` · `Jewel Case Ver. SET` …) */
  version: string;
  href: string;
}

export interface AlbumShop {
  /** 판매처 이름 (알라딘 · SMTOWN &STORE · Weverse shop …). 렌더링 key 로도 쓴다 */
  name: string;
  /** 로고 파일 key (`public/icons/<key>.png`). 로고가 없는 판매처는 비어 있다 */
  iconType?: string;
  /** 그 판매처가 파는 버전들. 노션 가로형 표의 한 행이 여기로 펴진다 */
  links: AlbumShopLink[];
}

/**
 * 앨범사 예약판매 링크 조회 (스키마는 docs/notion-album-db.md).
 * 조회에 실패하거나 DB 를 아직 안 만들었으면 목록만 비운다 —
 * 페이지는 기간 · 버전 · 특전과 「준비 중」 안내를 그대로 보여준다.
 */
export async function getAlbumShops(): Promise<AlbumShop[]> {
  try {
    return await getNotionAlbumShops();
  } catch (e) {
    console.error("[album-shops] 노션 조회 실패:", e);
    return [];
  }
}

/* ---------------- ALBUM: 팬덤 공구 (노션 DB) ---------------- */

export interface GroupOrder {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  key: string;
  /** 공구주 (제목 열) */
  host: string;
  /** 공구를 받는 곳 (네이버 폼 · 구글 폼 · 자체 사이트 …) */
  site?: string;
  /** 신청 주소. 아직 안 열렸으면 비어 있다 */
  href?: string;
  /** 비고 — 마감일 · 배송 조건처럼 운영진이 덧붙이는 한 줄 */
  note?: string;
}

/**
 * 팬덤 공구 목록 조회 (스키마는 docs/notion-album-db.md).
 *
 * **공구주 동의 없이 행을 채우지 않는다.** 링크 · 연락처가 공개되는 자리라
 * 컨택이 끝난 공구만 올린다. 비어 있는 동안 화면은 「공구주분 컨택 후 추가될
 * 예정입니다」 안내를 보여준다 (components/GroupOrders.tsx).
 */
export async function getGroupOrders(): Promise<GroupOrder[]> {
  try {
    return await getNotionGroupOrders(await requestLocale());
  } catch (e) {
    console.error("[group-orders] 노션 조회 실패:", e);
    return [];
  }
}
