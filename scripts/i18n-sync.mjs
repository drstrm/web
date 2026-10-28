#!/usr/bin/env node
/*
 * 화면 문구 번역 관리
 * ==================================================================
 *   node scripts/i18n-sync.mjs                     무엇이 미번역인가 (기본 · 과금 없음)
 *   node scripts/i18n-sync.mjs --adopt             손으로 채운 번역을 「최신」으로 인정
 *   node scripts/i18n-sync.mjs --translate         ⚠ Claude API 로 번역 (과금)
 *   node scripts/i18n-sync.mjs --translate --dry-run   번역해서 보여주고 파일은 안 씀
 *   옵션: --locales ja,zh · --force · --limit 10 · --effort medium
 *
 * ── 번역을 누가 하나 ─────────────────────────────────────────────
 * messages/*.json 의 문구는 **코드를 고치는 사람이 그 자리에서 번역한다.**
 * 이 파일들이 바뀌는 건 새 화면을 만들 때뿐이고, 그때는 이미 사람(또는 Claude)이
 * 대화 안에 있다 — 거기서 번역까지 끝내는 것이 가장 정확하고 비용이 0 이다.
 *
 * 그래서 이 스크립트의 기본 동작은 **번역이 아니라 점검**이다.
 *   · 인자 없이 실행 → 「어느 언어의 어느 키가 비었나 · 한국어가 바뀌었나」
 *   · --adopt        → 방금 채운 번역을 봉인 (다음 실행이 재번역하지 않게)
 *   · --translate    → API 호출. **명시해야만 돈다** (실수 과금 방지)
 *
 * 노션 콘텐츠(운영진이 쓰는 글)는 사람이 개입할 수 없는 자리라 사정이 다르다 —
 * 그쪽은 노션 웹훅이 Vercel 에서 API 로 번역한다. 용어집(scripts/i18n/glossary.mjs)
 * 과 해시 규칙 · 검증은 양쪽이 공유한다.
 *
 * ── 해시로 증분 판정 ────────────────────────────────────────────
 * messages/.hashes/<언어>.json 에 「이 번역이 어느 한국어에서 나왔는지」를 남긴다.
 *     해시 같음 → 건너뜀
 *     해시 다름 → 한국어가 수정됨 → 재번역 대상
 *     키가 없음 → 새 문구 → 번역 대상
 *
 * 사람이 손질한 번역은 messages/<언어>.overrides.json 에 넣는다. 그 키는
 * 기계번역이 **영구히 건드리지 않는다** — 네이티브 검수 결과를 넣는 자리다.
 *
 * ⚠ messages/ko.json 은 절대 쓰지 않는다 (읽기만). 한국어 원문은 사람만 고친다.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { glossaryPrompt } from "./i18n/glossary.mjs";

const SOURCE_LOCALE = "ko";

/** 한 번에 보낼 문구 수. 작게 나누면 실패해도 그 묶음만 잃는다 */
const CHUNK_SIZE = 50;

/*
 * 번역 품질이 제품 품질이라 기본 effort 를 낮추지 않는다. 문구 수백 개 수준에서는
 * 비용 차이가 무의미하다. 비용을 줄이고 싶으면 --effort medium 으로 낮춘다.
 */
const DEFAULT_EFFORT = "high";

/* ---------------- 인자 ---------------- */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const DRY_RUN = flag("dry-run");
/**
 * API 로 번역한다. **명시해야만 돈다.**
 *
 * 기본값을 번역으로 두지 않는 이유: 이 저장소에서 messages 번역은 사람이
 * 그 자리에서 하기로 했고(위 주석), 무심코 `pnpm i18n` 을 돌렸을 때 과금되는
 * 것이 가장 피해야 할 사고다. --plan 은 하위 호환으로 남긴다.
 */
const TRANSLATE = flag("translate");
/** 번역 대상만 세어 본다 (기본 동작). API 를 부르지 않으므로 키가 없어도 돈다 */
const PLAN_ONLY = !TRANSLATE && !flag("adopt");
/*
 * 이미 있는 번역을 「지금 한국어에서 나온 것」으로 인정하고 해시만 심는다.
 * 사람이(또는 세션 안의 Claude 가) 손으로 채운 첫 번역을 스크립트에 인계할 때 쓴다 —
 * 이걸 안 하면 다음 실행이 전량을 API 로 다시 번역한다. API 를 부르지 않는다.
 */
const ADOPT = flag("adopt");
const FORCE = flag("force");
const LIMIT = Number(value("limit", 0)) || 0;
const EFFORT = value("effort", DEFAULT_EFFORT);

/* ---------------- 자격 (.env 또는 환경변수) ---------------- */

function loadEnvFile() {
  try {
    return Object.fromEntries(
      readFileSync(new URL("../.env", import.meta.url), "utf8")
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [
            l.slice(0, i).trim(),
            l.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
          ];
        }),
    );
  } catch {
    // CI(GitHub Actions)에는 .env 가 없다 — 환경변수만 쓴다
    return {};
  }
}

const env = { ...loadEnvFile(), ...process.env };
const API_KEY = env.ANTHROPIC_API_KEY;

/* ---------------- 파일 경로 ---------------- */

const url = (p) => new URL(`../${p}`, import.meta.url);
const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(url(p), "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (p, data) =>
  writeFileSync(url(p), `${JSON.stringify(data, null, 2)}\n`);

/* ---------------- 중첩 JSON ↔ 평평한 점 경로 ---------------- */

/** `{a:{b:"x"}}` → `{"a.b":"x"}`. 번역 · 해시는 키 단위로 다뤄야 한다 */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

/** `{"a.b":"x"}` → `{a:{b:"x"}}`. ko.json 과 같은 모양으로 되돌려 쓴다 */
function unflatten(flat) {
  const out = {};
  for (const [path, v] of Object.entries(flat)) {
    const parts = path.split(".");
    let node = out;
    parts.slice(0, -1).forEach((p) => {
      node[p] ??= {};
      node = node[p];
    });
    node[parts.at(-1)] = v;
  }
  return out;
}

/* ---------------- 검증 ---------------- */

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/**
 * ICU 자리표시자 목록 (`{count}` · `{name}`).
 * 번역이 이걸 바꾸거나 빠뜨리면 화면에 `{count}` 가 그대로 찍히거나 터진다.
 */
const placeholders = (s) =>
  [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");

/**
 * 번역문을 받아들일지 판정. 거부하면 그 키는 한국어로 남는다 —
 * 깨진 번역을 내보내는 것보다 한국어가 보이는 게 낫다.
 */
function validate(key, source, translated) {
  if (!translated?.trim()) return "빈 번역";

  if (placeholders(source) !== placeholders(translated)) {
    return `자리표시자 불일치 (원문 {${placeholders(source)}} → 번역 {${placeholders(translated)}})`;
  }

  /*
   * 길이 가드. 배너 타이틀 · 버튼처럼 자리가 좁은 곳이 많아서, 원문의 3배를
   * 넘으면 레이아웃이 터질 수 있다. 짧은 문구는 번역이 길어지는 게 정상이라
   * 최소 길이를 넉넉히 둔다.
   */
  if (source.length >= 10 && translated.length > source.length * 3) {
    return `너무 김 (${source.length}자 → ${translated.length}자)`;
  }

  return null;
}

/* ---------------- 번역 ---------------- */

const Schema = z.object({
  translations: z.array(z.object({ key: z.string(), text: z.string() })),
});

const systemPrompt = (locale) => `당신은 K-POP 팬덤 웹사이트의 한국어 → ${locale} 번역가입니다.
이 사이트는 NCT DREAM 스트리밍팀의 공식 웹사이트로, 스트리밍 · 투표 · 앨범 구매
가이드를 팬에게 안내합니다. 읽는 사람은 **해외 팬**입니다.

번역 규칙
  1. 화면에 들어가는 UI 문구다. **짧고 또렷하게.** 원문보다 길어지지 않게 한다.
  2. 자리표시자(\`{count}\` · \`{title}\`)는 **글자 하나도 바꾸지 않고** 그대로 둔다.
  3. 아래 용어집을 반드시 따른다. 고유명사는 번역하지 않는다.
  4. 격식은 원문을 따른다 — 이 사이트는 팬에게 친근한 존댓말을 쓴다.
  5. 번역할 수 없거나 확신이 없으면 그 키를 **결과에서 빼라.** 추측하지 않는다
     (빠진 키는 한국어로 표시되므로 틀린 번역보다 안전하다).

${glossaryPrompt(locale)}`;

async function translateChunk(client, locale, entries) {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: [
      // 언어당 수십 묶음을 보내므로 시스템 프롬프트(용어집)를 캐시한다
      { type: "text", text: systemPrompt(locale), cache_control: { type: "ephemeral" } },
    ],
    output_config: { format: zodOutputFormat(Schema), effort: EFFORT },
    messages: [
      {
        role: "user",
        content: `다음 문구를 ${locale} 로 번역해 주세요. key 는 그대로 두고 text 만 번역합니다.\n\n${JSON.stringify(entries, null, 2)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`번역이 거부됐습니다: ${response.stop_details?.category}`);
  }
  if (!response.parsed_output) {
    throw new Error("구조화 출력 파싱 실패");
  }

  return { items: response.parsed_output.translations, usage: response.usage };
}

/* ---------------- 언어 하나 ---------------- */

async function syncLocale(client, locale, source) {
  const existing = flatten(readJson(`messages/${locale}.json`, {}));
  const overrides = flatten(readJson(`messages/${locale}.overrides.json`, {}));
  const hashes = FORCE ? {} : readJson(`messages/.hashes/${locale}.json`, {});

  // 사람이 손질한 키는 기계가 건드리지 않는다
  const candidates = Object.entries(source).filter(([key]) => !(key in overrides));
  const stale = candidates.filter(([key, ko]) => hashes[key] !== hash(ko));
  const todo = LIMIT ? stale.slice(0, LIMIT) : stale;

  console.log(
    `\n[${locale}] 전체 ${Object.keys(source).length} · 고정(overrides) ${Object.keys(overrides).length} · 번역 대상 ${todo.length}`,
  );

  if (ADOPT) {
    // 번역문이 이미 있는 키만 인정한다. 없는 키는 다음 실행에서 번역된다
    const adopted = todo.filter(([key]) => existing[key] !== undefined);
    adopted.forEach(([key, ko]) => (hashes[key] = hash(ko)));
    const missing = todo.length - adopted.length;
    mkdirSync(url("messages/.hashes"), { recursive: true });
    writeJson(`messages/.hashes/${locale}.json`, hashes);
    console.log(
      `  ✓ ${adopted.length}개 인정 (해시 심음)` +
        `${missing ? ` · ${missing}개는 번역문이 없어 다음 실행 대상으로 남긴다` : ""}`,
    );
    return missing;
  }

  if (todo.length === 0) {
    console.log(`  변경 없음 — 번역 호출 0`);
    return 0;
  }

  if (PLAN_ONLY) {
    todo.slice(0, 20).forEach(([key, ko]) => console.log(`    · ${key}  「${ko}」`));
    if (todo.length > 20) console.log(`    … 그리고 ${todo.length - 20}개 더`);
    return todo.length;
  }

  const translated = { ...existing };
  const rejected = [];
  let inTokens = 0;
  let outTokens = 0;
  let cacheRead = 0;

  for (let i = 0; i < todo.length; i += CHUNK_SIZE) {
    const chunk = todo.slice(i, i + CHUNK_SIZE);
    const entries = chunk.map(([key, text]) => ({ key, text }));
    process.stdout.write(`  ${i + 1}~${i + chunk.length} 번역 중… `);

    const { items, usage } = await translateChunk(client, locale, entries);
    inTokens += usage.input_tokens;
    outTokens += usage.output_tokens;
    cacheRead += usage.cache_read_input_tokens ?? 0;

    let ok = 0;
    for (const { key, text } of items) {
      const ko = source[key];
      if (ko === undefined) continue; // 모델이 만들어낸 키는 버린다

      const problem = validate(key, ko, text);
      if (problem) {
        rejected.push({ key, ko, text, problem });
        continue;
      }
      translated[key] = text;
      hashes[key] = hash(ko);
      ok += 1;
    }
    console.log(`${ok}/${chunk.length}`);
  }

  if (rejected.length) {
    console.log(`\n  ⚠ 거부된 번역 ${rejected.length}개 (해당 키는 한국어로 표시된다)`);
    rejected.forEach((r) => console.log(`    · ${r.key}: ${r.problem}\n      「${r.text}」`));
  }

  // overrides 를 마지막에 덮어 최종 결과를 만든다
  const merged = { ...translated, ...overrides };

  console.log(
    `  토큰 입력 ${inTokens} (캐시 ${cacheRead}) · 출력 ${outTokens}`,
  );

  if (DRY_RUN) {
    console.log(`\n  --dry-run: 파일을 쓰지 않습니다. 결과 미리보기 ↓`);
    todo.slice(0, 15).forEach(([key, ko]) => {
      console.log(`    ${key}\n      ko  ${ko}\n      ${locale}  ${merged[key] ?? "(번역 없음)"}`);
    });
    return todo.length;
  }

  mkdirSync(url("messages/.hashes"), { recursive: true });
  writeJson(`messages/${locale}.json`, unflatten(merged));
  writeJson(`messages/.hashes/${locale}.json`, hashes);
  console.log(`  ✓ messages/${locale}.json 갱신`);
  return todo.length;
}

/* ---------------- 실행 ---------------- */

async function main() {
  const source = flatten(readJson(`messages/${SOURCE_LOCALE}.json`, null) ?? {});
  if (Object.keys(source).length === 0) {
    console.error(`✗ messages/${SOURCE_LOCALE}.json 이 비어 있거나 없습니다.`);
    process.exit(1);
  }

  /*
   * 대상 언어는 i18n/routing.ts 가 아니라 **messages/ 에 있는 파일**에서 정한다.
   *   · routing.ts 는 TypeScript 라 이 스크립트가 바로 읽을 수 없다
   *   · 번역을 먼저 만들고 품질을 확인한 뒤 routing 에 올리는 순서이므로,
   *     routing 에 아직 없는 언어도 작업 대상이어야 한다
   */
  const locales = (value("locales", "") || discoverLocales())
    .split(",")
    .map((l) => l.trim())
    .filter((l) => l && l !== SOURCE_LOCALE);

  if (locales.length === 0) {
    console.error("✗ 번역할 언어가 없습니다. --locales en,ja,zh 처럼 지정하세요.");
    process.exit(1);
  }

  /*
   * 키 검사를 여기서 하지 않는다. 바꿀 게 없으면 번역을 부르지 않으므로
   * 키도 필요 없다 — 웹훅 · CI 가 헛돌 때 키 때문에 실패하지 않게 한다.
   * --plan 도 같은 이유로 키 없이 돈다.
   */
  const client = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

  console.log(
    `원본 messages/${SOURCE_LOCALE}.json — 문구 ${Object.keys(source).length}개` +
      `${FORCE ? " · --force(전량 재번역)" : ""}${DRY_RUN ? " · --dry-run" : ""}` +
      `${PLAN_ONLY ? " · --plan(호출 없음)" : ""}`,
  );

  let total = 0;
  for (const locale of locales) {
    if (!PLAN_ONLY && !ADOPT && !client) {
      // 번역이 필요한지 먼저 세어 보고, 필요할 때만 키를 요구한다
      const probe = await syncLocalePlan(locale, source);
      if (probe === 0) continue;
      console.error(
        "\n✗ ANTHROPIC_API_KEY 가 없습니다.\n" +
          "  로컬: .env 에 ANTHROPIC_API_KEY=sk-ant-… 한 줄을 넣으세요.\n" +
          "  CI:   GitHub Secrets 에 같은 이름으로 넣으세요.\n" +
          "  무엇이 번역 대상인지만 보려면: node scripts/i18n-sync.mjs --plan",
      );
      process.exit(1);
    }
    total += (await syncLocale(client, locale, source)) ?? 0;
  }

  if (PLAN_ONLY) console.log(`\n번역 대상 합계 ${total}개`);
}

/**
 * messages/ 에 있는 언어 파일을 찾는다 (`en.json` → `en`).
 * `*.overrides.json` 과 `.hashes/` 는 번역 대상이 아니므로 걸러낸다.
 */
function discoverLocales() {
  try {
    return readdirSync(url("messages"))
      .filter((f) => f.endsWith(".json") && !f.includes(".overrides."))
      .map((f) => f.replace(/\.json$/, ""))
      .filter((l) => l !== SOURCE_LOCALE)
      .join(",");
  } catch {
    return "";
  }
}

/** 키 없이 「몇 개가 번역 대상인가」만 센다 (위의 키 안내에 쓴다) */
async function syncLocalePlan(locale, source) {
  const overrides = flatten(readJson(`messages/${locale}.overrides.json`, {}));
  const hashes = FORCE ? {} : readJson(`messages/.hashes/${locale}.json`, {});
  return Object.entries(source).filter(
    ([key, ko]) => !(key in overrides) && hashes[key] !== hash(ko),
  ).length;
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
