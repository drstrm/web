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
  AlbumBenefit,
  AlbumShop,
  AlbumShopLink,
  FormKind,
  FormLink,
  FormStatus,
  GroupOrder,
  GuideImage,
  GuideItem,
  GuideSection,
  GuideStatus,
  QuickLink,
  StreamingList,
  StreamingTarget,
} from "@/lib/content";
import { matchShopIcon, nameKey } from "@/lib/album";
import { toSeoulDate } from "@/lib/datetime";
import { PLATFORM_ICONS } from "@/lib/platform-icons";
import { toHref } from "@/lib/url";

const API = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";

const TOKEN = process.env.NOTION_TOKEN;

/** 코드가 아는 노션 DB 목록. 행(row)은 전부 조회 결과로만 다룬다. */
type DbKey =
  | "guide"
  | "banner"
  | "streaming"
  | "links"
  | "forms"
  | "schedule"
  | "album"
  | "albumBenefit"
  | "groupOrder";

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
  album: {
    env: "NOTION_ALBUM_DB_ID",
    db: process.env.NOTION_ALBUM_DB_ID,
    ds: process.env.NOTION_ALBUM_DS_ID,
  },
  albumBenefit: {
    env: "NOTION_ALBUM_BENEFIT_DB_ID",
    db: process.env.NOTION_ALBUM_BENEFIT_DB_ID,
    ds: process.env.NOTION_ALBUM_BENEFIT_DS_ID,
  },
  groupOrder: {
    env: "NOTION_GROUP_ORDER_DB_ID",
    db: process.env.NOTION_GROUP_ORDER_DB_ID,
    ds: process.env.NOTION_GROUP_ORDER_DS_ID,
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

/* ---------------- 번역 열 (`_EN`) 읽기 ---------------- */

/*
 * 운영진이 노션에 쓴 글을 언어별로 읽는다.
 * ------------------------------------------------------------------
 * 규칙 하나다 — **번역할 열 이름 뒤에 `_EN` 을 붙인 텍스트 열을 만든다.**
 *
 *     배너 DB
 *       타이틀        타이틀_EN        설명            설명_EN
 *       컴백 D-7      Comeback D-7    스밍 준비됐나요?  Ready to stream?
 *
 * 왜 노션에 두나: 번역문이 노션 칸에 **보이고 운영진이 고칠 수 있다.** 스밍 · 총공 ·
 * 공구 · 특전은 기계번역이 특히 틀리는 말들이라, 안 보이는 캐시(KV 같은 것)에 넣으면
 * 오역을 영원히 모른다. 덤으로 인프라가 한 개도 늘지 않는다.
 *
 * 왜 왕복이 늘지 않나: queryRows() 가 캐시한 **같은 응답에서 열만 골라 읽는다.**
 * 6개 언어든 1개든 노션 요청 수는 그대로다. 번역을 별도 DB(관계형)로 빼면 이 장점이
 * 사라진다 — 노션 relation 은 id 만 주고 내용은 안 준다.
 *
 * 비어 있으면 **한국어가 나온다.** 「아직 번역되지 않았다」는 정직한 상태이고 깨진
 * 화면이 아니다 (i18n/request.ts 의 메시지 폴백과 같은 규칙).
 *
 * 채우는 쪽은 **노션 AI 자동 채우기**다. 운영진이 한국어를 고치면 노션이 그 칸을
 * 스스로 다시 번역한다 — 코드는 **읽기만 한다.** 번역에 쓰는 프롬프트(용어집 ·
 * 번역 금지 목록)는 docs/notion-ai-translate-prompt.md 에 있다.
 *
 * ⚠ 그래서 이 파일에 노션 **쓰기는 없다.** 번역 품질은 노션 프롬프트가 쥐고 있고,
 *   오역은 운영진이 그 칸에서 직접 고친다. 자세한 설계는 docs/i18n.md.
 */

/** 번역의 원문 언어. 이 언어에는 접미어가 없다 (한국어 열이 곧 원문이다) */
const SOURCE_LOCALE = "ko";

/**
 * 번역이 없는 언어가 떨어지는 곳. **한국어가 아니면 영어를 보여준다.**
 *
 * 화면 문구(messages/*.json)는 6개 언어를 다 채워 두지만, 노션 콘텐츠는 운영진이
 * 칸을 채워야 늘어난다. 그래서 `설명_JA` 가 없을 때 고를 수 있는 것이 둘이다 —
 * 한국어를 보여주거나, 영어를 보여주거나.
 *
 * 영어로 둔다. 일본어판을 보는 사람은 **한국어보다 영어를 읽을 가능성이 훨씬 높고**,
 * 노션 콘텐츠를 영어 한 벌만 유지해도 비한국어 사용자 전체가 읽을 수 있게 된다
 * (언어마다 칸을 채우는 부담이 1/5 이 된다).
 *
 * 그 결과 일본어판은 「화면 문구는 일본어 · 노션 콘텐츠는 영어」가 된다. 섞이지만,
 * 「일본어 화면에 한국어 콘텐츠」보다는 읽을 수 있는 상태다.
 */
const FALLBACK_LOCALE = "en";

/**
 * 제목(Title) 열의 번역을 담는 **고정된 열 이름.**
 *
 * 노션 DB 에는 제목 열이 **딱 하나만** 있을 수 있어서 `이름` / `이름_EN` 같은 짝을
 * 만들 수 없고, 코드는 제목을 이름이 아니라 **타입으로** 찾는다(titleOf). 즉 짝이 될
 * 「원래 이름」이 DB 마다 다르다 (`이름` · `Name` · `버튼 이름` · `판매처` · `공구주 서명`).
 * 그래서 제목 번역만은 원래 열 이름이 무엇이든 이 이름 하나로 못박는다.
 */
const TITLE_ALIAS = "제목";

/**
 * 제목 열의 번역을 담는 열 이름으로 **받아 주는** 별칭들.
 *
 * 문서는 `제목_EN` 하나만 안내하지만, 실제로 열을 만드는 사람은 `title_EN` 이라고
 * 쓰기도 한다 (코드가 영어라 자연스러운 선택이다). 둘을 다 받는다 —
 * **이름을 못 맞춰 번역이 조용히 안 나오는 것**이 가장 나쁜 실패다.
 *
 * 원래 제목 열 이름 + 접미어(`버튼 이름_EN` · `이름_EN`)도 읽는다 — 별칭이 아니라
 * **실제로 그 이름의 열을 찾는** 경로라 아래 배열에는 적지 않는다 (localizedTitle).
 */
const TITLE_ALIASES = [TITLE_ALIAS, "title"];

/**
 * 번역 열 접미어 (`설명` → `설명_EN`). 언어 코드는 messages/ 파일명과 같다.
 * 원문 언어(또는 모르는 값)면 null — 그때는 한국어 열을 그대로 읽는다.
 */
function localeSuffix(locale?: string): string | null {
  const code = (locale ?? "").trim().toLowerCase();
  if (!code || code === SOURCE_LOCALE) return null;
  return `_${code.toUpperCase()}`;
}

/**
 * 찾아볼 접미어를 **순서대로**. 그 언어 → 영어 → (빈 배열이면 한국어 원문).
 * 한국어는 빈 배열이다 — 원문 열을 그대로 읽는다.
 */
function localeSuffixes(locale?: string): string[] {
  const own = localeSuffix(locale);
  if (!own) return [];
  const fallback = localeSuffix(FALLBACK_LOCALE);
  return fallback && fallback !== own ? [own, fallback] : [own];
}

/**
 * 열 이름을 **대소문자 구분 없이** 찾는다 (`설명_EN` · `설명_en` · `설명_En`).
 *
 * docs/notion-guide-db.md 의 설계 원칙 2 — 「운영진이 지켜야 할 규칙을 만들지
 * 않는다」 — 와 같은 결이고, normalized() 가 이름의 앞뒤 공백을 터는 것과 같은
 * 이유다. 열 이름을 소문자로 적었다고 번역이 조용히 사라지면 원인을 짚을 수 없다.
 */
function propLoose(
  props: Record<string, NotionProperty>,
  name: string,
): NotionProperty | undefined {
  const direct = props[name];
  if (direct) return direct;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(props)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return undefined;
}

/** 제목 열이든 텍스트 열이든 같은 방식으로 읽는다 (운영진이 어느 타입으로 만들든) */
const textOf = (prop?: NotionProperty): string =>
  text(prop?.rich_text ?? prop?.title);

/** 제목(Title) 열의 **이름**. `제목_EN` 말고 `버튼 이름_EN` 도 받으려고 쓴다 */
function titleName(props: Record<string, NotionProperty>): string | undefined {
  return Object.entries(props).find(([, v]) => v.type === "title")?.[0];
}

/**
 * 이름으로 찾는 텍스트 열의 **그 언어 값.** 비면 한국어 원문.
 *
 *     localized(p, "설명", locale)   // 설명_EN 먼저, 비면 설명
 */
export function localized(
  props: Record<string, NotionProperty>,
  name: string,
  locale?: string,
): string {
  for (const suffix of localeSuffixes(locale)) {
    const value = textOf(propLoose(props, `${name}${suffix}`));
    if (value) return value;
  }
  return textOf(props[name]);
}

/**
 * 제목(Title) 열의 **그 언어 값.** 비면 한국어 원문.
 *
 * `제목_EN` 을 먼저 보고, 없으면 원래 제목 열 이름 + 접미어(`버튼 이름_EN`)도 받는다.
 * 운영진이 어느 쪽으로 만들어도 동작하게 두되, 문서는 `제목_EN` 하나만 안내한다.
 */
export function localizedTitle(
  props: Record<string, NotionProperty>,
  locale?: string,
): string {
  const own = titleName(props);

  // 언어가 먼저다 — `title_JA` 가 있으면 `제목_EN` 보다 그쪽을 쓴다
  for (const suffix of localeSuffixes(locale)) {
    // `제목_JA` · `title_JA`, 그리고 원래 제목 열 이름 + 접미어 (`이름_JA`)
    for (const alias of [...TITLE_ALIASES, ...(own ? [own] : [])]) {
      const value = textOf(propLoose(props, `${alias}${suffix}`));
      if (value) return value;
    }
  }

  return titleOf(props);
}

/**
 * 선택지 열 값 목록.
 *
 * 운영진이 같은 칸을 선택(Select)으로 만들기도, 다중 선택(Multi-select)으로 만들기도
 * 한다 — 「버전」처럼 한 행에 하나만 걸릴 때도 있고 여럿이 걸릴 때도 있는 칸이 그렇다.
 * 어느 쪽으로 만들어도 읽히게 둔다 (순서를 읽는 getSelectOptions 도 둘 다 받는다).
 */
function selectValues(prop?: NotionProperty): string[] {
  const multi = (prop?.multi_select ?? []).map((o) => o.name.trim());
  const one = prop?.select?.name?.trim();
  return [...multi, ...(one ? [one] : [])].filter(Boolean);
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

function toRow(page: NotionPage, locale?: string): MappedRow | null {
  const p = normalized(page);

  /*
   * 제목은 두 몫을 한다 — **화면에 보이는 이름**과 **슬러그의 재료**다. 갈라 둔다.
   *
   *   slugTitle  언제나 한국어 제목. 번역문으로 슬러그를 만들면 언어마다 주소가
   *              갈라져서, 이미 공유된 `/guide/download/멜론-xxxxxxx` 링크가
   *              영어판에서 다른 주소가 되고 언어 스위치가 같은 글로 못 간다.
   *   title      그 언어의 제목 (`제목_EN`). 비면 한국어가 그대로 나온다.
   *
   * ⚠ slugTitle 은 **절대 번역하지 않는다.** 여기 localizedTitle 을 넣으면
   *   언어마다 주소가 생기고 이미 공유된 링크가 죽는다 (docs/i18n.md).
   */
  const slugTitle = titleOf(p);
  const title = localizedTitle(p, locale);
  const sectionLabel = p["섹션"]?.select?.name?.trim() ?? "";
  // 제목이나 섹션이 비면 어디에도 놓을 수 없다 (노션 기본 빈 행이 여기서 걸러진다)
  if (!slugTitle || !sectionLabel) return null;

  const status = STATUS_MAP[p["상태"]?.select?.name?.trim() ?? ""] ?? "coming-soon";
  const summary = localized(p, "설명", locale) || undefined;

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
        // 노션 제목이 이미 「… 가이드」 · 「… Guide」 로 끝난다. 말을 덧붙이면
        // 번역 제목에서 언어가 섞인다 (`Melon Gift Guide 가이드`).
        alt: files.length > 1 ? `${title} ${i + 1}` : title,
      },
    ];
  });

  return {
    sectionLabel,
    // 비어 있으면 맨 뒤로
    order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
    item: {
      slug: toSlug(slugTitle, page.id),
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
  locale?: string,
  revalidate = 300,
): Promise<GuideSection[]> {
  const rows = queryRows("guide", revalidate)
    .then((pages) =>
      pages.map((page) => toRow(page, locale)).filter((r): r is MappedRow => r !== null),
    );

  const mapped = await rows;

  return SECTIONS.filter((s) => s.page === target)
    .map((section) => ({
      id: section.id,
      title: section.label,
      items: mapped
        .filter((r) => r.sectionLabel === section.label)
        /*
         * `순서` 가 비었거나 같으면 제목순이다. 보는 언어의 정렬 규칙으로 비교한다 —
         * 영어판 목록이 영어 제목 기준으로 A→Z 가 된다 (`제목_EN`).
         */
        .sort(
          (a, b) =>
            a.order - b.order ||
            a.item.title.localeCompare(b.item.title, locale ?? SOURCE_LOCALE),
        )
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
export async function getBanners(
  locale?: string,
  revalidate = 300,
): Promise<NotionBanner[]> {
  const pages = await queryRows("banner", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const file = (p["이미지"]?.files ?? [])[0];
    const url = file ? fileUrl(file) : null;
    const background = colorValue(p["배경색"]);
    if (!url && !background) return [];

    // `타이틀` 이 제목(Title) 열이든 텍스트 열이든 똑같이 읽는다.
    const title = localized(p, "타이틀", locale) || undefined;
    const subtitle = localized(p, "설명", locale) || undefined;

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
          /*
           * 문구가 없으면 비워 둔다. 「배너」 같은 기본값을 여기서 넣으면 그
           * 한국어가 어느 언어에서도 그대로 나간다 — 폴백은 화면이 번역해서
           * 넣는다 (components/BannerSlider.tsx).
           */
          alt: title ?? "",
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
export async function getQuickLinks(
  locale?: string,
  revalidate = 300,
): Promise<QuickLink[]> {
  const pages = await queryRows("links", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);
    // 제목 열을 **타입으로** 찾는다 — 운영진이 `버튼 이름` 을 고쳐 써도 버티고,
    // 번역은 `제목_EN` 한 곳에서 온다 (localizedTitle).
    const label = localizedTitle(p, locale);
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
 * 노션 `구분` 선택지 → 페이지 (`/community/forms` · `/community/helper`).
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
  locale?: string,
  revalidate = 300,
): Promise<FormLink[]> {
  const pages = await queryRows("forms", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const title = localizedTitle(p, locale);
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
          ...(localized(p, "설명", locale) ? { summary: localized(p, "설명", locale) } : {}),
          ...(localized(p, "기간", locale) ? { period: localized(p, "기간", locale) } : {}),
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
  /** `종류` 선택지. 기본 아이콘이 여기서 갈린다 (lib/kind-icon.ts) */
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
export async function getSchedules(
  locale?: string,
  revalidate = 300,
): Promise<NotionSchedule[]> {
  const pages = await queryRows("schedule", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    const title = localizedTitle(p, locale);
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
    const description = localized(p, "설명", locale);
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

/* ---------------- 앨범 버전 · 특전 ---------------- */

/** `추가 특전` 칸의 여러 줄을 항목으로 쪼갠다. 운영진이 찍어 둔 글머리표는 떼어낸다 */
const toBenefitItems = (raw: string): string[] =>
  raw
    .split("\n")
    .map((line) => line.replace(/^[\s•·‧∙*-]+/, "").trim())
    .filter(Boolean);

/**
 * 버전 · 특전 조회 (스키마는 docs/notion-album-db.md).
 *
 * 화면의 「앨범 버전 · 특전」 표가 이 DB 의 행을 그대로 그린다. 「전 버전 공통」처럼
 * 버전이 아닌 줄도 운영진이 적어 둔 그대로 한 줄로 내보낸다 — 코드가 특정 이름을
 * 알아야 하는 규칙을 두지 않으려는 것이다. 줄을 더하고 빼고 옮기는 일이 전부
 * 노션에서 끝난다.
 *
 * 이 DB 는 **앨범사 카드의 버전 버튼 순서 · 표기도 함께 정한다**(getAlbumShops).
 * 예약판매 DB 는 버전이 열로 누워 있는데 노션 API 가 열 순서를 알려주지 않아서,
 * 순서를 쥘 곳이 필요하다. 같은 버전 목록을 두 군데 적지 않도록 여기를 기준으로 삼는다.
 */
export async function getAlbumBenefits(
  locale?: string,
  revalidate = 300,
): Promise<AlbumBenefit[]> {
  const pages = await queryRows("albumBenefit", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    /*
     * ⚠ 버전 이름은 **번역하지 않는다** — 예약판매 DB 의 열 이름과 맞춰야 하는
     *   매칭 키다(versionMatcher). `제목_EN` 을 만들어도 여기서는 읽지 않는다.
     */
    const version = titleOf(p);
    // 버전 이름이 비면 표에 놓을 자리가 없다 (노션 기본 빈 행이 여기서 걸러진다)
    if (!version) return [];

    const benefits = toBenefitItems(localized(p, "추가 특전", locale));
    const note = localized(p, "비고", locale);

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        row: {
          key: page.id,
          version,
          benefits,
          ...(note ? { note } : {}),
        } satisfies AlbumBenefit,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.row);
}

/* ---------------- 앨범 예약판매 (앨범사 링크) ---------------- */

/**
 * 예약판매 DB 의 **열 이름** → 화면 표기 · 순서.
 *
 * 기준은 특전 DB 의 행 순서다. 열 이름은 사람이 치는 값이라 표기가 흔들리므로
 * (`SMini Ver` · `Special ver.`) 느슨하게 맞춰 특전 DB 의 표기로 통일한다.
 *
 * 세트 칸(`Jewel Case Ver. set`)은 특전 DB 에 줄이 따로 없다 — 표에서는 단품 줄의
 * 「세트 구매 가능」으로 합쳐 두기 때문이다. 그래서 끝의 `set` 을 떼고 단품을 찾아
 * **그 바로 뒤**에 꽂는다(order + 0.5). 단품과 세트가 붙어 있어야 고를 때 헷갈리지 않는다.
 */
function versionMatcher(benefits: AlbumBenefit[]) {
  const index = new Map(benefits.map((b, order) => [nameKey(b.version), { label: b.version, order }]));

  return (columnName: string): { label: string; order: number } => {
    const key = nameKey(columnName);
    const exact = index.get(key);
    if (exact) return exact;

    const base = key.replace(/set$/, "");
    const unit = base === key ? undefined : index.get(base);
    if (unit) return { label: `${unit.label} SET`, order: unit.order + 0.5 };

    // 특전 DB 에 없는 열 — 이름 그대로, 맨 뒤에
    return { label: columnName, order: benefits.length + 1 };
  };
}

/**
 * 앨범사 예약판매 링크 조회 (스키마는 docs/notion-album-db.md).
 *
 * 이 DB 는 다른 DB 와 모양이 다르다. **한 행이 판매처 하나, 버전마다 열이 하나**인
 * 가로형 표다 (예스24 행의 `Photobook Ver.` 칸 · `Jewel Case Ver.` 칸 … 에 각각
 * 주소가 들어간다). 앨범사 × 버전 매트릭스를 사람이 채우고 빈칸을 눈으로 훑기에는
 * 이 모양이 압도적으로 편해서, 운영진이 만든 구조를 그대로 받았다.
 *
 * 그래서 **열 이름을 코드에 박지 않는다.** 제목 열(= 판매처)과 `순서` 를 뺀 나머지
 * 열을 전부 돌면서, 값이 주소로 읽히는 칸만 링크로 삼는다. 덕분에 버전 열을 더하거나
 * 이름을 고쳐도 배포가 필요 없고, 설명용 열(`비고` 같은)이 생겨도 주소가 아니라서
 * 저절로 무시된다. 열 이름을 박아 두면 운영진이 열 이름 끝에 특전 문구를 한 줄
 * 덧붙이는 순간 그 버전이 화면에서 사라진다 — 실제로 지금 그렇게 적혀 있다.
 *
 * 표시 순서
 *  - 판매처(카드): `순서` 숫자 열 → 없거나 비면 노션에 행을 추가한 순서
 *  - 버전 버튼: 특전 DB 의 줄 순서(versionMatcher). 특전 조회가 실패해도 링크는
 *    살아야 하므로, 그때는 순서 없이 열 이름 그대로 내보낸다.
 */
export async function getAlbumShops(revalidate = 300): Promise<AlbumShop[]> {
  const [pages, benefits] = await Promise.all([
    queryRows("album", revalidate),
    /*
     * 같은 조회를 페이지에서도 하지만 Next 의 fetch 캐시가 한 번으로 합친다.
     * 언어는 넘기지 않는다 — 여기서 쓰는 것은 **버전 이름을 예약판매 DB 의 열
     * 이름과 맞추는 매칭 키**다 (versionMatcher). 번역된 이름으로는 못 맞춘다.
     */
    getAlbumBenefits(undefined, revalidate).catch((e) => {
      console.error("[album-shops] 버전 순서를 못 읽었다 (열 이름 그대로 쓴다):", e);
      return [] as AlbumBenefit[];
    }),
  ]);

  const matchVersion = versionMatcher(benefits);

  /** 링크 칸이 아닌 열. 이름이 곧 버전인 DB 라 「버전이 아닌 것」만 추려 둔다 */
  const NOT_A_VERSION = new Set(["판매처", "순서"]);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    // 제목 열이 판매처다. 선택 열로 바꿔 쓰더라도 읽히게 둔다
    const name = selectValues(p["판매처"])[0] || titleOf(p);
    if (!name) return [];

    const links = Object.entries(p).flatMap(([column, prop]) => {
      if (prop.type === "title" || NOT_A_VERSION.has(column)) return [];
      /*
       * 주소는 URL 열로도, 텍스트 열로도 들어온다(운영진이 표에 붙여 넣으면 텍스트).
       * 주소로 읽히지 않는 칸은 빈칸이거나 설명 열이므로 그대로 버린다.
       */
      const href = linkValue(prop);
      if (!href) return [];

      // 열 이름 첫 줄만 쓴다 — 그 아래 줄에는 특전 설명이 붙어 있다
      const { label, order } = matchVersion(column.split("\n")[0].trim());
      return [{ order, link: { version: label, href } satisfies AlbumShopLink }];
    });

    // 링크가 하나도 없는 행은 카드를 만들지 않는다 (노션 기본 빈 행 · 아직 안 채운 행)
    if (links.length === 0) return [];

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        shop: {
          name,
          // 로고가 있는 판매처만. 없으면 화면이 기본 상점 그림을 쓴다 (lib/album.ts)
          ...(matchShopIcon(name) ? { iconType: matchShopIcon(name) } : {}),
          links: links.sort((a, b) => a.order - b.order).map((l) => l.link),
        } satisfies AlbumShop,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.shop);
}

/* ---------------- 팬덤 공구 ---------------- */

/**
 * 팬덤 공구 목록 조회 (스키마는 docs/notion-album-db.md).
 *
 * 앨범사 링크와 DB 를 나눠 둔다. 열이 겹치지 않고(공구주 · 공구 사이트 · 비고),
 * 무엇보다 **채워 넣는 조건이 다르다** — 앨범사는 공지가 나오면 바로 올리지만,
 * 공구는 공구주 컨택 · 동의가 끝난 것만 올린다. 한 DB 에 섞으면 그 구분이
 * 열 하나(`구분`)에 걸리게 되고, 실수로 섞인 행이 바로 공개된다.
 *
 * `공구 URL` 이 비어도 행은 남긴다 — 「누가 공구를 연다」까지는 알리고 신청만
 * 기다리는 상태가 실제로 있다. 화면에서는 링크 없이 「준비 중」으로 나온다.
 *
 * 표시 순서는 `순서` 숫자 열, 없거나 비면 노션에 행을 추가한 순서(BY_CREATED).
 */
export async function getGroupOrders(
  locale?: string,
  revalidate = 300,
): Promise<GroupOrder[]> {
  const pages = await queryRows("groupOrder", revalidate);

  const rows = pages.flatMap((page) => {
    const p = normalized(page);

    // 제목 열은 이름이 아니라 타입으로 찾는다 — `공구주` · `공구주 성명` 어느 쪽이든 읽힌다
    const host = titleOf(p);
    // 공구주가 비면 누구 공구인지 알 수 없다 (노션 기본 빈 행이 여기서 걸러진다)
    if (!host) return [];

    // 공구 사이트를 텍스트로 적어도, 선택지로 만들어도 읽는다
    const site = text(p["공구 사이트"]?.rich_text) || selectValues(p["공구 사이트"])[0] || "";
    const href = linkValue(p["공구 URL"] ?? p["URL"] ?? p["url"]);
    // 공구주명 · 공구 사이트는 고유명사라 그대로 두고, 자유 서술인 `비고` 만 번역한다
    const note = localized(p, "비고", locale);

    return [
      {
        order: p["순서"]?.number ?? Number.MAX_SAFE_INTEGER,
        row: {
          key: page.id,
          host,
          ...(site ? { site } : {}),
          ...(href ? { href } : {}),
          ...(note ? { note } : {}),
        } satisfies GroupOrder,
      },
    ];
  });

  return rows.sort((a, b) => a.order - b.order).map((r) => r.row);
}
