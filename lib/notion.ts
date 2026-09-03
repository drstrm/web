/*
 * 노션 DB 조회 (공식 API) — 가이드 · 홈 배너 · 일정
 * ------------------------------------------------------------------
 * SDK(@notionhq/client) 없이 fetch만 사용한다. Next 의 데이터 캐시는 fetch() 에만
 * 붙으므로, SDK 를 쓰면 ISR 을 쓰려고 unstable_cache 로 한 겹 더 감싸야 한다.
 *
 * 스키마 · 셋업은 docs/notion-guide-db.md · docs/notion-banner-db.md 참고.
 *
 * ⚠ 이미지 URL 을 그대로 클라이언트에 내보내지 않는다.
 *   노션이 주는 S3 URL 은 X-Amz-Expires=3600 (1시간) 이라, 캐시된 HTML 에 박히면
 *   시간이 지난 뒤 방문한 사용자에게 이미지가 전부 403 으로 깨진다.
 *   대신 /api/guide-image · /api/banner-image 프록시 주소를 넘기고,
 *   서명 URL 은 서버에만 둔다.
 */

import type {
  FormKind,
  FormLink,
  FormStatus,
  GuideImage,
  GuideItem,
  GuideSection,
  GuideStatus,
  QuickLink,
  StreamingList,
  StreamingTarget,
} from "@/lib/content";
import { toSeoulDate } from "@/lib/datetime";
import { PLATFORM_ICONS } from "@/lib/platform-icons";
import { toHref } from "@/lib/url";

const API = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";

const TOKEN = process.env.NOTION_TOKEN;

/** 코드가 아는 노션 DB 목록. 행(row)은 전부 조회 결과로만 다룬다. */
type DbKey = "guide" | "banner" | "streaming" | "links" | "forms" | "schedule";

const DATABASES: Record<DbKey, { env: string; db?: string; ds?: string }> = {
  guide: {
    env: "NOTION_GUIDE_DB_ID",
    db: process.env.NOTION_GUIDE_DB_ID,
    ds: process.env.NOTION_GUIDE_DS_ID,
  },
  banner: {
    env: "NOTION_BANNER_DB_ID",
    db: process.env.NOTION_BANNER_DB_ID,
    ds: process.env.NOTION_BANNER_DS_ID,
  },
  streaming: {
    env: "NOTION_STREAMING_DB_ID",
    db: process.env.NOTION_STREAMING_DB_ID,
    ds: process.env.NOTION_STREAMING_DS_ID,
  },
  links: {
    env: "NOTION_LINKS_DB_ID",
    db: process.env.NOTION_LINKS_DB_ID,
    ds: process.env.NOTION_LINKS_DS_ID,
  },
  forms: {
    env: "NOTION_FORMS_DB_ID",
    db: process.env.NOTION_FORMS_DB_ID,
    ds: process.env.NOTION_FORMS_DS_ID,
  },
  schedule: {
    env: "NOTION_SCHEDULE_DB_ID",
    db: process.env.NOTION_SCHEDULE_DB_ID,
    ds: process.env.NOTION_SCHEDULE_DS_ID,
  },
};

/** 가이드가 노출되는 페이지 (= /guide/<GuidePage>) */
export type GuidePage =
  | "streaming"
  | "id-generate"
  | "voting"
  | "download"
  | "etc";

/**
 * 노션 `섹션` 선택지 → 페이지 · 섹션 매핑. 배열 순서가 곧 화면 표시 순서다.
 * 선택지를 추가하려면 노션과 여기를 함께 고쳐야 한다(가이드 항목 추가는 불필요).
 */
const SECTIONS: { label: string; page: GuidePage; id: string }[] = [
  { label: "음원 스트리밍", page: "streaming", id: "audio" },
  { label: "MV 스트리밍", page: "streaming", id: "mv" },
  { label: "아이디 생성", page: "id-generate", id: "id-generate" },
  { label: "음악방송 투표", page: "voting", id: "music-show" },
  { label: "시상식 투표", page: "voting", id: "awards" },
  { label: "음원 다운로드", page: "download", id: "audio-dl" },
  { label: "MV 다운로드", page: "download", id: "mv-dl" },
  { label: "기타 가이드", page: "etc", id: "etc" },
];

const STATUS_MAP: Record<string, GuideStatus> = {
  공개: "ready",
  오픈예정: "coming-soon",
};

/** 노션 `플랫폼` 표시명(한글) → public/icons/<key>.png 의 key */
const PLATFORM_KEY_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORM_ICONS).map(([key, label]) => [label, key]),
);

/* ---------------- 노션 응답 (필요한 부분만) ---------------- */

interface NotionFile {
  name?: string;
  type: "file" | "external";
  file?: { url: string; expiry_time?: string };
  external?: { url: string };
}

interface NotionProperty {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  files?: NotionFile[];
  number?: number | null;
  url?: string | null;
  checkbox?: boolean;
  date?: NotionDate;
}

/**
 * 노션 `기간`(date) 값.
 *
 * 시각까지 적으면 오프셋이 붙은 ISO(`2026-08-27T19:00:00.000+09:00`)로, 날짜만
 * 적으면 `2026-08-27` 로 온다 — `T` 유무가 곧 「하루 종일」 여부다. 끝을 안 적으면
 * `end` 가 null 이다.
 */
type NotionDate = { start: string; end?: string | null } | null;

interface NotionPage {
  id: string;
  parent?: { type?: string; data_source_id?: string };
  properties: Record<string, NotionProperty>;
}

/* ---------------- 공통 fetch ---------------- */

async function notionFetch<T>(
  path: string,
  opts: { method?: string; body?: string; revalidate?: number } = {},
): Promise<T> {
  if (!TOKEN) {
    throw new Error("NOTION_TOKEN 환경변수가 설정되지 않았습니다.");
  }
  const res = await fetch(`${API}/${path}`, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: opts.body,
    // revalidate 를 주면 ISR 캐시, 생략하면 매번 새로 조회(서명 URL 갱신용)
    ...(opts.revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate: opts.revalidate } }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // 404 는 "DB 에 연결(Connection)을 안 붙임"인 경우가 대부분이다.
    throw new Error(`Notion ${res.status}: ${path} — ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * 2025-09-03 부터 DB 는 데이터 소스의 컨테이너이고, 행 조회는 데이터 소스로 한다.
 * 값이 바뀌지 않으므로 .env(NOTION_*_DS_ID)에 넣어두면 왕복 한 번을 아낀다.
 */
const dataSourceCache = new Map<DbKey, string>();

async function getDataSourceId(key: DbKey): Promise<string> {
  const conf = DATABASES[key];
  if (conf.ds) return conf.ds;
  const cached = dataSourceCache.get(key);
  if (cached) return cached;
  if (!conf.db) {
    throw new Error(`${conf.env} 환경변수가 설정되지 않았습니다.`);
  }
  // 여기서 revalidate 를 쓰면 안 된다. Next 의 fetch 캐시는 실패 응답도 그대로
  // 담아 두므로, DB 에 연결(Connection)을 붙이기 전에 한 번 404 가 나면 그 404 를
  // 캐시 기간 내내 다시 꺼내 쓴다 — 노션에서 고쳐도 화면이 안 돌아온다.
  // 왕복은 아래 dataSourceCache(프로세스 메모리)가 어차피 한 번으로 줄여 준다.
  const db = await notionFetch<{ data_sources?: { id: string }[] }>(
    `databases/${conf.db}`,
  );
  const id = db.data_sources?.[0]?.id;
  if (!id) throw new Error(`데이터 소스를 찾을 수 없습니다 (DB ${conf.db})`);
  dataSourceCache.set(key, id);
  return id;
}

/** 조회 정렬. 노션 API 의 `sorts` 를 그대로 넘긴다 */
type RowSort = { timestamp: "created_time" | "last_edited_time"; direction: "ascending" | "descending" };

/**
 * 노션에 행을 **추가한 순서**(= 위에서 아래로 쌓인 순서).
 *
 * ⚠ 노션 API 는 DB 에서 행을 끌어 옮긴 순서(뷰의 수동 정렬)를 알려주지 않는다.
 *   행 객체에 순서 필드가 아예 없고, `sorts` 를 생략하면 **`created_time` 내림차순**
 *   (= 최근에 만든 행이 맨 위)이 된다. 즉 「정렬을 안 주면 DB 에 보이는 순서대로
 *   온다」는 것은 사실이 아니다 — 새 행을 아래에 추가하는 보통의 쓰임에서는 화면과
 *   정확히 **반대로** 나온다.
 *
 *   그래서 오름차순을 명시한다. 행을 드래그하지 않은 DB 라면 이게 노션에서 보이는
 *   순서와 같다. 드래그로 순서를 바꿔야 한다면 `순서` 숫자 열을 만들어야 한다
 *   (각 조회 함수가 그 열이 있으면 우선 적용한다).
 */
const BY_CREATED: RowSort[] = [{ timestamp: "created_time", direction: "ascending" }];

/** 한 DB 의 모든 행을 가져온다. */
async function queryRows(
  key: DbKey,
  revalidate: number,
  sorts: RowSort[] = BY_CREATED,
): Promise<NotionPage[]> {
  const ds = await getDataSourceId(key);
  const rows: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await notionFetch<{
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    }>(`data_sources/${ds}/query`, {
      method: "POST",
      body: JSON.stringify({
        page_size: 100,
        sorts,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
      revalidate,
    });
    rows.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return rows;
}

/**
 * 데이터 소스 스키마(열 정의). 선택(select · multi_select) 열의 **선택지 순서**를
 * 읽으려고 쓴다 — 노션에서 선택지를 끌어 옮긴 순서가 곧 화면 표시 순서가 된다.
 * 순서 전용 숫자 열을 따로 만들지 않고도 운영진이 순서를 쥘 수 있는 지점이다.
 */
interface NotionSchema {
  properties: Record<
    string,
    {
      type: string;
      select?: { options?: { name: string }[] };
      multi_select?: { options?: { name: string }[] };
    }
  >;
}

async function getSelectOptions(
  key: DbKey,
  revalidate: number,
  ...props: string[]
): Promise<string[][]> {
  const ds = await getDataSourceId(key);
  const schema = await notionFetch<NotionSchema>(`data_sources/${ds}`, { revalidate });
  // 열 이름도 앞뒤 공백을 털어서 찾는다 (normalized() 와 같은 이유)
  const byName = new Map(
    Object.entries(schema.properties).map(([name, def]) => [name.trim(), def]),
  );
  return props.map((name) => {
    const def = byName.get(name);
    const options = def?.select?.options ?? def?.multi_select?.options ?? [];
    return options.map((o) => o.name.trim()).filter(Boolean);
  });
}

/* ---------------- 속성 읽기 ---------------- */

/**
 * 속성 이름의 앞뒤 공백을 털어낸다.
 *
 * 노션 UI 에서는 이름 끝의 공백이 보이지 않는데, API 로는 `"설명 "` 처럼 그대로
 * 넘어온다. 운영진이 알아챌 수 없는 실수이므로 코드가 흡수한다.
 * 선택지 값(`섹션`·`상태`·`플랫폼`)도 같은 이유로 trim 한다.
 */
function normalized(page: NotionPage): Record<string, NotionProperty> {
  const out: Record<string, NotionProperty> = {};
  for (const [key, value] of Object.entries(page.properties)) {
    out[key.trim()] = value;
  }
  return out;
}

const text = (parts?: { plain_text: string }[]) =>
  (parts ?? []).map((t) => t.plain_text).join("").trim();

/**
 * 제목(Title) 열 값. **열 이름이 아니라 타입으로** 찾는다.
 *
 * 노션이 새 DB 에 만들어 주는 제목 열 이름은 UI 언어에 따라 `이름` 이기도 `Name`
 * 이기도 하고, 운영진이 `폼 이름` 처럼 고쳐 쓰기도 한다. 제목 열은 DB 마다 하나뿐이라
 * 타입으로 찾으면 그 셋을 전부 흡수한다 (이름을 못 맞춰 목록이 통째로 비는 사고 방지).
 */
function titleOf(props: Record<string, NotionProperty>): string {
  return text(Object.values(props).find((v) => v.type === "title")?.title);
}

const fileUrl = (f: NotionFile): string | null =>
  (f.type === "file" ? f.file?.url : f.external?.url) ?? null;

/**
 * 이미지 버전 토큰.
 *
 * 서명 URL 의 **경로만** 해싱한다. 쿼리스트링에는 매번 달라지는 서명이 들어 있어서,
 * 그대로 넣으면 토큰이 조회할 때마다 바뀌고 캐시가 전부 무효화된다.
 * 경로에는 파일마다 고유한 UUID 가 들어 있으므로, 운영진이 이미지를 교체할 때만
 * 토큰이 바뀐다 — 「키는 불변, 갱신은 즉시」가 성립하는 지점이다.
 */
/** FNV-1a 32비트. 짧고 안정적인 토큰이 필요한 곳에서 쓴다(암호용 아님). */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function versionToken(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url;
  }
  return fnv1a(path).toString(36);
}

/**
 * 상세 페이지 주소에 쓰는 슬러그 (`/guide/download/<slug>`).
 *
 * 제목만 쓰면 섹션이 달라도 같은 이름(음원 다운로드 「멜론」 / MV 다운로드 「멜론」)이
 * 겹치므로, 뒤에 page id 를 해시한 꼬리표를 붙여 유일성을 보장한다.
 * 이 꼬리표 덕분에 운영진이 제목을 고쳐도 기존 링크를 찾아갈 수 있다(lib/content.ts).
 *
 * ⚠ id 앞자리를 자르면 안 된다. 같은 DB 의 노션 page id 는 앞부분이 서로 같아서
 *   (생성 시각 기반) 모든 항목이 같은 꼬리표를 갖게 된다. 전체를 해시한다.
 */
export const SLUG_ID_LENGTH = 7;

function slugIdTail(pageId: string): string {
  return fnv1a(pageId.replace(/-/g, "").toLowerCase())
    .toString(36)
    .padStart(SLUG_ID_LENGTH, "0");
}

function toSlug(title: string, pageId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^가-힣ㄱ-ㅎa-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const tail = slugIdTail(pageId);
  return base ? `${base}-${tail}` : tail;
}

/* ---------------- 행 → GuideItem ---------------- */

interface MappedRow {
  sectionLabel: string;
  order: number;
  item: GuideItem;
}

function toRow(page: NotionPage): MappedRow | null {
  const p = normalized(page);

  const title = text(p["제목"]?.title);
  const sectionLabel = p["섹션"]?.select?.name?.trim() ?? "";
  // 제목이나 섹션이 비면 어디에도 놓을 수 없다 (노션 기본 빈 행이 여기서 걸러진다)
  if (!title || !sectionLabel) return null;

  const status = STATUS_MAP[p["상태"]?.select?.name?.trim() ?? ""] ?? "coming-soon";
  const summary = text(p["설명"]?.rich_text) || undefined;

  const iconTypes = (p["플랫폼"]?.multi_select ?? [])
    .map((o) => PLATFORM_KEY_BY_LABEL[o.name.trim()])
    .filter((k): k is string => Boolean(k));

  const files = p["이미지"]?.files ?? [];
  const images: GuideImage[] = files.flatMap((f, i) => {
    const url = fileUrl(f);
    if (!url) return [];
    return [
      {
        src:
          `/api/guide-image?p=${encodeURIComponent(page.id)}` +
          `&i=${i}&v=${versionToken(url)}`,
        alt: files.length > 1 ? `${title} 가이드 ${i + 1}` : `${title} 가이드`,
      },
    ];
  });

  return {
    sectionLabel,
    // 비어 있으면 맨 뒤로
    order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
    item: {
      slug: toSlug(title, page.id),
      title,
      status,
      ...(summary ? { summary } : {}),
      ...(images.length ? { images } : {}),
      ...(iconTypes.length ? { iconTypes } : {}),
    },
  };
}

/* ---------------- 공개 API ---------------- */

/**
 * 한 가이드 페이지에 표시할 섹션 목록을 만든다.
 * 항목이 하나도 없는 섹션은 제외한다 — 빈 제목만 덩그러니 남지 않도록.
 *
 * 조회 실패 시 예외를 던진다. 호출부(lib/content.ts)에서 잡아 빈 배열로 처리한다.
 */
export async function getGuideSections(
  target: GuidePage,
  revalidate = 300,
): Promise<GuideSection[]> {
  const rows = queryRows("guide", revalidate)
    .then((pages) => pages.map(toRow).filter((r): r is MappedRow => r !== null));

  const mapped = await rows;

  return SECTIONS.filter((s) => s.page === target)
    .map((section) => ({
      id: section.id,
      title: section.label,
      items: mapped
        .filter((r) => r.sectionLabel === section.label)
        .sort((a, b) => a.order - b.order || a.item.title.localeCompare(b.item.title, "ko"))
        .map((r) => r.item),
    }))
    .filter((section) => section.items.length > 0);
}

/* ---------------- 이미지 프록시용 원본 조회 ---------------- */

export interface NotionFileSource {
  url: string;
  name: string;
}

/**
 * 이미지 프록시(app/api/*-image)용. 요청 시점의 **새 서명 URL** 을 받아온다.
 * 캐시하면 만료된 URL 을 재사용하게 되므로 항상 no-store 로 조회한다.
 *
 * pageId 는 URL 파라미터로 들어오는 값이라 그대로 믿지 않는다.
 * 지정한 데이터 소스에 속한 페이지가 아니면 거부한다 — 그러지 않으면 이 라우트가
 * "토큰이 읽을 수 있는 아무 페이지의 첨부파일이나 꺼내주는 창구"가 된다.
 * 연결(Connection)이 붙은 DB 가 늘어나는 순간 조용히 구멍이 되는 지점이라,
 * DB 별로 프록시를 따로 두고 각자 자기 데이터 소스만 검사한다.
 */
async function getImageSource(
  key: DbKey,
  pageId: string,
  index: number,
): Promise<NotionFileSource | null> {
  const page = await notionFetch<NotionPage>(`pages/${pageId}`);

  // 노션 ID 는 하이픈이 있는 형태와 없는 형태가 섞여 쓰인다(.env 에 어느 쪽을
  // 넣어도 동작해야 한다). 비교 전에 형태를 맞춘다.
  const bare = (id?: string) => id?.replace(/-/g, "").toLowerCase();
  if (bare(page.parent?.data_source_id) !== bare(await getDataSourceId(key))) {
    return null;
  }

  const files = normalized(page)["이미지"]?.files ?? [];
  const file = files[index];
  if (!file) return null;

  const url = fileUrl(file);
  if (!url) return null;

  return { url, name: file.name ?? `${key}-${index + 1}` };
}

export const getGuideImageSource = (pageId: string, index: number) =>
  getImageSource("guide", pageId, index);

export const getBannerImageSource = (pageId: string, index: number) =>
  getImageSource("banner", pageId, index);

/* ---------------- 스밍리스트 원클릭 ---------------- */

/**
 * 노션 `운영체제` 선택지 → 화면 표기.
 * 운영진이 소문자로 적어 둔 값(`ios`)을 화면에서만 다듬는다. 여기 없는 값은 그대로 쓴다.
 */
const OS_LABELS: Record<string, string> = { ios: "iOS", ipados: "iPadOS" };

const osLabel = (raw: string) => OS_LABELS[raw.toLowerCase()] ?? raw;

/**
 * 스밍리스트 원클릭 조회 (플랫폼 > 운영체제 > 링크).
 *
 * 노션은 한 행이 링크 하나다. `운영체제` 가 다중 선택이므로 한 링크가 여러 OS 에
 * 걸릴 수 있고(플로 = 안드로이드 + iOS), 반대로 한 (플랫폼, OS) 칸에 링크가
 * 여러 개일 수도 있다(멜론 안드로이드 1~4번). 그래서 행을 (플랫폼, OS) 로 펼친 뒤
 * 다시 묶는다.
 *
 * 표시 순서는 전부 노션이 쥔다.
 *  - 플랫폼 · 운영체제: 각 선택지 열의 **선택지 순서**
 *  - 한 칸 안의 링크: `순서` 숫자 열 (비면 뒤로)
 */
export async function getStreamingLists(revalidate = 300): Promise<StreamingList[]> {
  const [[platformOrder, osOrder], pages] = await Promise.all([
    getSelectOptions("streaming", revalidate, "플랫폼", "운영체제"),
    queryRows("streaming", revalidate),
  ]);

  const rank = (order: string[], value: string) => {
    const i = order.indexOf(value);
    // 선택지 목록에 없으면(운영진이 방금 추가) 맨 뒤로 보내되 순서는 유지한다
    return i === -1 ? order.length : i;
  };

  /** 플랫폼 → OS → 링크. Map 이라 넣은 순서가 유지된다 */
  const byPlatform = new Map<string, Map<string, { order: number; href: string }[]>>();

  for (const page of pages) {
    const p = normalized(page);
    const platform = p["플랫폼"]?.select?.name?.trim() ?? "";
    const href = toHref(p["URL"]?.url);
    const targets = (p["운영체제"]?.multi_select ?? [])
      .map((o) => o.name.trim())
      .filter(Boolean);
    // 셋 중 하나라도 비면 버튼을 만들 수 없다 (노션 기본 빈 행이 여기서 걸러진다)
    if (!platform || !href || targets.length === 0) continue;

    const order = p["순서"]?.number ?? Number.MAX_SAFE_INTEGER;
    const osMap = byPlatform.get(platform) ?? new Map();
    byPlatform.set(platform, osMap);

    for (const os of targets) {
      const links = osMap.get(os) ?? [];
      osMap.set(os, links);
      links.push({ order, href });
    }
  }

  return [...byPlatform.entries()]
    .sort((a, b) => rank(platformOrder, a[0]) - rank(platformOrder, b[0]))
    .map(([platform, osMap]): StreamingList => {
      /*
       * 링크가 완전히 같은 기기끼리 한 줄로 합친다.
       * 노션에서 `운영체제` 를 다중 선택으로 걸어 둔 행(벅스 앱 = 안드로이드 · iOS ·
       * 아이패드)을 그대로 펼치면 같은 버튼이 기기 수만큼 반복된다. 화면에서는
       * 「이 기기들은 링크가 하나」라고 한 번만 말하는 편이 짧고 헷갈리지 않는다.
       */
      const merged = new Map<string, StreamingTarget>();

      for (const [os, entries] of [...osMap.entries()].sort(
        (a, b) => rank(osOrder, a[0]) - rank(osOrder, b[0]),
      )) {
        const links = entries.sort((a, b) => a.order - b.order).map((l) => l.href);
        const key = links.join("\n");
        const found = merged.get(key);
        if (found) found.os.push(osLabel(os));
        else merged.set(key, { os: [osLabel(os)], links });
      }

      return {
        platform,
        ...(PLATFORM_KEY_BY_LABEL[platform]
          ? { iconType: PLATFORM_KEY_BY_LABEL[platform] }
          : {}),
        targets: [...merged.values()],
      };
    });
}

/* ---------------- 홈 배너 ---------------- */

export interface NotionBanner {
  /** 노션 page id */
  id: string;
  /** 배경 이미지 프록시 주소 (`/api/banner-image?p=…&i=…&v=…`) */
  image?: string;
  /** 이미지가 없을 때 깔 배경색 (검증된 CSS 색) */
  background?: string;
  alt: string;
  href?: string;
  title?: string;
  subtitle?: string;
}

/**
 * 노션 `링크` 열 읽기.
 * 운영진이 URL 타입으로 만들 수도, 텍스트 타입으로 만들 수도 있어 둘 다 받는다.
 *
 * 스밍리스트 · 바로가기와 같은 보정을 거친다(lib/url.ts). 예전에는 여기만 원본을
 * 그대로 내보냈는데, 그러면 `tinyurl.com/x` 를 적었을 때 배너 클릭이 사이트 안
 * 404 로 가고 `javascript:` 도 그대로 통과한다.
 */
function linkValue(prop?: NotionProperty): string | undefined {
  const raw = (prop?.url ?? "").trim() || text(prop?.rich_text);
  return toHref(raw) ?? undefined;
}

/**
 * 노션 `배경색` 열 → CSS 색.
 *
 * 자유 텍스트 칸이라 형태가 제각각으로 들어온다(`#00BFFF` · `00bfff` · `skyblue`).
 * 알아볼 수 있는 형태만 통과시키고 나머지는 버린다 — style 에 이상한 값이 들어가도
 * 브라우저가 조용히 무시할 뿐이라, 걸러 두는 편이 화면에서 원인을 짚기 쉽다.
 */
function colorValue(prop?: NotionProperty): string | undefined {
  const raw = text(prop?.rich_text);
  if (!raw) return undefined;
  // # 를 빠뜨리고 적는 경우가 잦다
  if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(raw)) return `#${raw}`;
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;
  if (/^(?:rgb|hsl)a?\([0-9a-z\s.,%/]+\)$/i.test(raw)) return raw;
  // skyblue · white 같은 CSS 색 이름
  if (/^[a-z]{3,20}$/i.test(raw)) return raw.toLowerCase();
  return undefined;
}

/**
 * 홈 슬라이드 배너 조회.
 *
 * 배경(이미지 또는 배경색)이 없는 행은 건너뛴다 — 배너로 성립하지 않을뿐더러,
 * 노션이 기본으로 만들어 두는 빈 행이 여기서 함께 걸러진다.
 *
 * 순서는 가이드 · 바로가기와 같은 규칙이다. `순서` 숫자 열이 있으면 그 값,
 * 없으면 노션에 추가한 순서(queryRows 의 BY_CREATED). 이 DB 는 원래 「행을 끌어
 * 옮긴 순서」에 기대고 있었는데, 노션 API 가 그 순서를 알려주지 않는다.
 */
export async function getBanners(revalidate = 300): Promise<NotionBanner[]> {
  const pages = await queryRows("banner", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const file = (p["이미지"]?.files ?? [])[0];
    const url = file ? fileUrl(file) : null;
    const background = colorValue(p["배경색"]);
    if (!url && !background) return [];

    // `타이틀` 이 제목(Title) 열이든 텍스트 열이든 똑같이 읽는다.
    const title = text(p["타이틀"]?.title ?? p["타이틀"]?.rich_text) || undefined;
    const subtitle = text(p["설명"]?.rich_text) || undefined;

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        banner: {
          id: page.id,
          // 이미지가 있으면 이미지가 이긴다. 배경색은 이미지를 아직 못 올렸을 때의 대안.
          ...(url
            ? {
                image:
                  `/api/banner-image?p=${encodeURIComponent(page.id)}` +
                  `&i=0&v=${versionToken(url)}`,
              }
            : { background }),
          alt: title ?? "배너",
          ...(linkValue(p["링크"]) ? { href: linkValue(p["링크"]) } : {}),
          ...(title ? { title } : {}),
          ...(subtitle ? { subtitle } : {}),
        } satisfies NotionBanner,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.banner);
}

/* ---------------- 홈 바로가기 아이콘 ---------------- */

/**
 * 홈 바로가기 아이콘 조회 (스키마는 docs/notion-links-db.md).
 *
 * `URL` 열에는 내부 경로(`/oneclick/voting`)와 외부 주소가 섞여 들어온다.
 * 어느 쪽인지는 <SmartLink> 가 판단하므로 여기서는 보정만 하고 넘긴다.
 *
 * 표시 순서는 노션이 쥔다. `순서` 숫자 열이 있으면 그 값, 없으면 노션에 행을 추가한
 * 순서다(queryRows 의 BY_CREATED). `순서` 값이 전부 같으면 정렬이 입력 순서를
 * 흩뜨리지 않으므로(JS sort 는 안정 정렬) 열을 안 만들어도 그대로 동작한다.
 */
export async function getQuickLinks(revalidate = 300): Promise<QuickLink[]> {
  const pages = await queryRows("links", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);
    const label = text(p["버튼 이름"]?.title);
    const href = toHref(p["URL"]?.url);
    // 이름이나 링크가 비면 버튼을 만들 수 없다 (노션 기본 빈 행이 여기서 걸러진다)
    if (!label || !href) return [];

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        link: {
          key: page.id,
          label,
          // 이모지를 안 적어도 칸이 빈 채로 남지 않게 한다
          emoji: text(p["emoji"]?.rich_text) || "🔗",
          href,
        } satisfies QuickLink,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.link);
}

/* ---------------- 폼 · 헬퍼 목록 ---------------- */

/**
 * 노션 `구분` 선택지 → 페이지 (`/forms` · `/helper`).
 * 여기 없는 값을 적은 행은 어느 페이지에도 나오지 않는다.
 */
const FORM_KIND_BY_LABEL: Record<string, FormKind> = {
  폼: "form",
  form: "form",
  헬퍼: "helper",
  helper: "helper",
};

/** 노션 `상태` 선택지 → 화면 상태. 비어 있으면 신청 가능으로 본다 */
const FORM_STATUS_BY_LABEL: Record<string, FormStatus> = {
  진행중: "open",
  모집중: "open",
  신청중: "open",
  마감: "closed",
  종료: "closed",
  예정: "upcoming",
  오픈예정: "upcoming",
  준비중: "upcoming",
};

/**
 * 폼 · 헬퍼 목록 조회 (스키마는 docs/notion-forms-db.md).
 *
 * 폼과 헬퍼는 **한 DB** 를 `구분` 열로 나눠 쓴다. 운영 방식(폼 링크 하나 + 기간 +
 * 마감 여부)이 같아서 열도 같고, DB 를 둘로 나누면 연결(Connection) · 환경변수 ·
 * 문서가 통째로 두 벌이 된다.
 *
 * 표시 순서는 노션이 쥔다 — `순서` 숫자 열, 없거나 비면 행을 추가한 순서.
 */
export async function getFormLinks(
  kind: FormKind,
  revalidate = 300,
): Promise<FormLink[]> {
  const pages = await queryRows("forms", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const title = titleOf(p);
    const rowKind = FORM_KIND_BY_LABEL[p["구분"]?.select?.name?.trim() ?? ""];
    // 제목이 비었거나(노션 기본 빈 행) 다른 페이지의 행이면 건너뛴다
    if (!title || rowKind !== kind) return [];

    const href = linkValue(p["URL"] ?? p["url"]);
    const marked = FORM_STATUS_BY_LABEL[p["상태"]?.select?.name?.trim() ?? ""] ?? "open";
    /*
     * 링크가 없으면 눌러도 갈 곳이 없다 — 「신청하기」 버튼을 띄우지 않고 준비 중으로
     * 내린다. 마감은 링크 유무와 무관하게 마감이다(폼을 닫아 두고 링크만 남기는 경우).
     */
    const status: FormStatus = marked === "closed" ? "closed" : href ? marked : "upcoming";

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        link: {
          key: page.id,
          title,
          status,
          // 마감 · 준비 중이면 주소를 아예 내보내지 않는다 (화면에서 링크가 안 생긴다)
          ...(status === "open" && href ? { href } : {}),
          ...(text(p["설명"]?.rich_text) ? { summary: text(p["설명"]?.rich_text) } : {}),
          ...(text(p["기간"]?.rich_text) ? { period: text(p["기간"]?.rich_text) } : {}),
          ...(text(p["emoji"]?.rich_text) ? { emoji: text(p["emoji"]?.rich_text) } : {}),
        } satisfies FormLink,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.link);
}

/* ---------------- 일정 (캘린더 · To Do · 투표 공용) ---------------- */

/**
 * 일정 한 건 (스키마는 docs/notion-schedule-db.md).
 *
 * 캘린더 · To Do · 투표가 **한 DB** 를 `노출 위치` 열로 나눠 쓴다. 셋 다 같은 컴백
 * 일정을 각자 다르게 보여줄 뿐이라, DB 를 나누면 운영진이 같은 일정을 세 번 적게 된다.
 *
 * 노션 `기간` 열 하나가 시작 · 종료 · 「하루 종일」 셋을 함께 담는다(NotionDate).
 */
export interface NotionSchedule {
  /** 노션 page id. 목록 렌더링 key 로만 쓴다 */
  id: string;
  title: string;
  description?: string;
  /** `종류` 선택지. 기본 이모지가 여기서 갈린다 (lib/kind-emoji.ts) */
  kind: string;
  /** `노출 위치` 다중 선택 (calendar · todo · vote) */
  surfaces: string[];
  /** 노션에 시각을 안 적은 일정 (= 하루 종일) */
  allDay: boolean;
  /** KST `YYYY-MM-DD`. `기간` 을 통째로 비우면 null (= 기한 없는 상시 할일) */
  startDate: string | null;
  endDate: string | null;
  /** 노션 원본 값. 마감 시각 표시에 쓴다 (lib/datetime.ts) */
  startsAt: string | null;
  endsAt: string | null;
  /** 기간 판정용 절대시각(ms). null 이면 그쪽 끝이 열려 있다는 뜻 */
  startMs: number | null;
  endMs: number | null;
  /** 데뷔일 · 생일처럼 매년 같은 날 돌아오는 일정 */
  recurringYearly: boolean;
  /** 기간 내내 매일 해야 하는 할일 — 마감 대신 「매일」로 표시한다 */
  daily: boolean;
  /** 운영진이 지정한 이모지 (없으면 kind 기본값) */
  emoji?: string;
  /** public/icons/<key>.png 의 key */
  iconType?: string;
  url?: string;
  guideUrl?: string;
  /**
   * `순서` 숫자 열. 비어 있으면 맨 뒤(Number.MAX_SAFE_INTEGER).
   * 이 배열은 이미 order 순으로 정렬돼 있지만, To Do 처럼 2차 정렬 키를 더 붙이는
   * 화면이 있어서 값 자체를 남겨 둔다 (lib/content.ts 의 getTodoList).
   */
  order: number;
}

const DAY_MS = 86_400_000;

/** 시각 없이 날짜만 적힌 값 (`2026-08-27`) */
const dateOnly = (value: string) => !value.includes("T");

/** 날짜만 적힌 값은 KST 자정으로 읽는다 — 서버가 UTC 여도 결과가 같아야 한다 */
const toMs = (value: string) =>
  Date.parse(dateOnly(value) ? `${value}T00:00:00+09:00` : value);

/** 노션 `기간` 값을 캘린더(날짜)와 To Do · 투표(절대시각)가 각각 쓸 형태로 편다 */
function parsePeriod(date: NotionDate | undefined) {
  const start = date?.start;
  // 기간을 안 적은 행은 기한이 없다는 뜻이다. 달력에는 놓을 자리가 없고 To Do 에만 남는다.
  if (!start) {
    return {
      allDay: true,
      startDate: null,
      endDate: null,
      startsAt: null,
      endsAt: null,
      startMs: null,
      endMs: null,
    };
  }

  const end = date?.end ?? null;

  return {
    allDay: dateOnly(start),
    startDate: dateOnly(start) ? start : toSeoulDate(start),
    endDate: end === null ? null : dateOnly(end) ? end : toSeoulDate(end),
    startsAt: start,
    endsAt: end,
    startMs: toMs(start),
    /*
     * 하루 종일 일정의 종료일은 「그 날 끝까지」다. 운영진이 `8/1 → 8/7` 로 적으면
     * 8/7 하루를 포함하겠다는 뜻이므로 다음 날 자정까지 살려 둔다 —
     * 값을 그대로 읽으면 8/7 00:00 이 되어 할일이 하루 일찍 사라진다.
     */
    endMs: end === null ? null : dateOnly(end) ? toMs(end) + DAY_MS : toMs(end),
  };
}

/**
 * 노션 `플랫폼` 값 → public/icons 의 key.
 *
 * 일정 DB 는 key 를 그대로 적고(`mnetplus`), 가이드 DB 는 표시명을 적는다(`엠넷플러스`).
 * 어느 쪽으로 적어도 아이콘이 나오도록 둘 다 받는다.
 */
function platformKey(name: string): string | undefined {
  const value = name.trim();
  return value in PLATFORM_ICONS ? value : PLATFORM_KEY_BY_LABEL[value];
}

/**
 * 일정 전체 조회. 화면별로 거르는 일은 호출부(lib/content.ts)가 한다.
 *
 * 기간 필터를 노션에 넘기지 않는 것은 의도적이다. 노션에는 PostgREST 의 `now` 같은
 * 리터럴이 없어서 「지금」을 넣으려면 조회 body 에 현재 시각을 박아야 하는데,
 * Next 의 fetch 캐시는 body 까지 키로 잡으므로 매 렌더가 캐시 미스가 된다.
 * 행이 많아야 수백 건이라, 전부 받아 두고 시각 판단은 렌더 시점에 하는 편이 싸다.
 *
 * `revalidate` 는 호출부가 정한다. Next 는 페이지의 ISR 과 그 안에서 부른 fetch 중
 * **더 짧은 쪽**을 쓰므로, 여기서 60 을 기본으로 두면 홈 전체가 1분마다 다시 그려진다.
 * 그래서 기본은 다른 DB 와 같은 300 이고, 투표 라우트만 60 을 넘긴다.
 *
 * 표시 순서는 노션이 쥔다. `순서` 숫자 열이 있으면 그 값, 없으면 행을 추가한
 * 순서다(queryRows 의 BY_CREATED). 화면이 여기에 2차 키를 더 붙이기도 한다.
 */
export async function getSchedules(revalidate = 300): Promise<NotionSchedule[]> {
  const pages = await queryRows("schedule", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const title = titleOf(p);
    const surfaces = (p["노출 위치"]?.multi_select ?? [])
      .map((o) => o.name.trim())
      .filter(Boolean);
    // 제목이 비었거나(노션 기본 빈 행) 노출 위치를 안 고르면 어느 화면에도 못 놓는다
    if (!title || surfaces.length === 0) return [];

    // 아이콘은 한 칸에 하나만 쓴다. 여러 개를 골랐으면 아는 것 중 첫 번째.
    const iconType = (p["플랫폼"]?.multi_select ?? [])
      .map((o) => platformKey(o.name))
      .find((key): key is string => Boolean(key));

    // 열 이름을 `url` 로 적은 DB 도, `URL` 로 적은 DB 도 있다 (다른 DB 와 맞춤)
    const url = linkValue(p["url"] ?? p["URL"]);
    const guideUrl = linkValue(p["guide_url"] ?? p["가이드"]);
    const description = text(p["설명"]?.rich_text);
    const emoji = text(p["emoji"]?.rich_text);

    return [
      {
        id: page.id,
        title,
        kind: p["종류"]?.select?.name?.trim() || "etc",
        surfaces,
        ...parsePeriod(p["기간"]?.date),
        recurringYearly: p["매년 반복 여부"]?.checkbox ?? false,
        daily: p["매일 반복 여부"]?.checkbox ?? false,
        ...(description ? { description } : {}),
        ...(emoji ? { emoji } : {}),
        ...(iconType ? { iconType } : {}),
        ...(url ? { url } : {}),
        ...(guideUrl ? { guideUrl } : {}),
        // 비어 있으면 맨 뒤로
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
      } satisfies NotionSchedule,
    ];
  });

  return rows.sort((a, b) => a.order - b.order);
}
