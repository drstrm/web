#!/usr/bin/env node
/*
 * 노션 연결 점검 (읽기 전용)
 * ------------------------------------------------------------------
 *   node scripts/notion-check.mjs
 *
 * .env 를 읽어서 DB 마다 이걸 확인한다.
 *   - 연결(Connection)이 붙어 있나           → 안 붙었으면 404
 *   - .env 의 DB ID · DS ID 가 맞나          → DS ID 는 없으면 알려준다
 *   - 열 이름이 코드가 찾는 것과 같나         → 앞뒤 공백 · 오타가 여기서 잡힌다
 *   - 화면에 나갈 순서가 어떻게 되나          → `순서` 열 유무에 따라 다르다
 *
 * ⚠ 노션 API 는 「행을 끌어 옮긴 순서」를 알려주지 않는다. 그래서 이 스크립트가
 *   보여주는 순서가 노션 화면과 다를 수 있고, 그럴 때 답은 `순서` 숫자 열이다.
 */

import { readFileSync } from "node:fs";

const NOTION_VERSION = "2026-03-11";
const API = "https://api.notion.com/v1";

/** 코드가 각 DB 에서 실제로 읽는 열 (lib/notion.ts 와 맞춰 둘 것) */
const DATABASES = [
  {
    label: "가이드",
    env: "GUIDE",
    required: ["제목", "섹션"],
    optional: ["상태", "설명", "플랫폼", "이미지", "순서"],
    orderBy: "순서",
    tiebreak: "title",
  },
  {
    label: "배너",
    env: "BANNER",
    required: [],
    optional: ["타이틀", "설명", "이미지", "배경색", "링크", "순서"],
    orderBy: "순서",
  },
  {
    label: "스밍리스트",
    env: "STREAMING",
    required: ["플랫폼", "운영체제", "URL"],
    optional: ["순서"],
    orderBy: "선택지",
  },
  {
    label: "바로가기",
    env: "LINKS",
    required: ["버튼 이름", "URL"],
    optional: ["emoji", "순서"],
    orderBy: "순서",
  },
  {
    // 제목 열은 이름을 안 본다(타입으로 찾는다) — lib/notion.ts 의 titleOf()
    label: "일정 (캘린더 · To Do · 투표)",
    env: "SCHEDULE",
    // `기간` 은 필수가 아니다 — 비우면 기한 없는 상시 할일이 된다
    required: ["노출 위치"],
    optional: [
      "기간",
      "종류",
      "플랫폼",
      "매년 반복 여부",
      "매일 반복 여부",
      "url",
      "guide_url",
      "설명",
      "emoji",
      "순서",
    ],
    // 아래 출력은 `순서` 열 기준이다. To Do 는 여기에 마감 임박 순이 2차 키로 더 붙는다
    orderBy: "순서",
  },
  {
    // 제목 열은 이름을 안 본다(타입으로 찾는다) — lib/notion.ts 의 titleOf()
    label: "폼 · 헬퍼",
    env: "FORMS",
    required: ["구분", ["URL", "url"]],
    optional: ["설명", "상태", "기간", "emoji", "순서"],
    orderBy: "순서",
    // 아직 안 만들었을 수 있다. 없으면 /forms · /helper 가 「준비 중」으로 나온다
    optionalDb: true,
  },
];

/* ---------------- .env ---------------- */

let env;
try {
  env = Object.fromEntries(
    readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
} catch {
  console.error("✗ .env 를 읽을 수 없습니다. 프로젝트 루트에서 실행하세요.");
  process.exit(1);
}

if (!env.NOTION_TOKEN) {
  console.error("✗ NOTION_TOKEN 이 .env 에 없습니다.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

async function call(path, init = {}) {
  const res = await fetch(`${API}/${path}`, { headers, ...init });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

const plain = (parts) => (parts ?? []).map((p) => p?.plain_text ?? "").join("");

/** 행의 제목 열 값 (열 이름이 DB 마다 달라서 타입으로 찾는다) */
function rowTitle(page) {
  const prop = Object.values(page.properties ?? {}).find((p) => p.type === "title");
  return plain(prop?.title) || "(제목없음)";
}

/* ---------------- 점검 ---------------- */

let problems = 0;
const note = (ok, msg) => {
  if (!ok) problems++;
  console.log(`   ${ok ? "✓" : "✗"} ${msg}`);
};

console.log(`노션 연결 점검 (Notion-Version: ${NOTION_VERSION})\n`);

for (const db of DATABASES) {
  const dbId = env[`NOTION_${db.env}_DB_ID`];
  const dsIdEnv = env[`NOTION_${db.env}_DS_ID`];

  console.log(`■ ${db.label}  (NOTION_${db.env}_DB_ID)`);

  if (!dbId) {
    // 아직 안 만든 DB 는 문제로 세지 않는다 (해당 화면만 「준비 중」으로 나온다)
    if (db.optionalDb) {
      console.log(`   · .env 에 NOTION_${db.env}_DB_ID 가 없습니다 — 아직 DB 를 안 만들었다면 정상입니다`);
    } else {
      note(false, `.env 에 NOTION_${db.env}_DB_ID 가 없습니다`);
    }
    console.log();
    continue;
  }

  const meta = await call(`databases/${dbId}`);
  if (!meta.ok) {
    note(
      false,
      meta.status === 404
        ? `404 — DB 를 못 찾습니다. ID 가 틀렸거나 연결(Connection)을 안 붙였습니다`
        : `${meta.status} ${meta.body.code ?? ""} ${(meta.body.message ?? "").slice(0, 120)}`,
    );
    console.log();
    continue;
  }

  const dsId = meta.body.data_sources?.[0]?.id;
  note(true, `"${plain(meta.body.title)}" 연결됨${meta.body.is_inline ? " (인라인)" : ""}`);

  if (!dsId) {
    note(false, "데이터 소스를 찾을 수 없습니다");
    console.log();
    continue;
  }
  const bare = (v) => v?.replace(/-/g, "").toLowerCase();
  if (!dsIdEnv) {
    note(false, `NOTION_${db.env}_DS_ID 가 없습니다. .env 에 넣으면 요청당 왕복 한 번을 아낍니다:\n     NOTION_${db.env}_DS_ID=${dsId}`);
  } else {
    note(bare(dsIdEnv) === bare(dsId), `DS ID 일치 (${dsId})`);
  }

  // 열 이름 — 코드는 앞뒤 공백을 털어서 찾으므로 여기서도 그렇게 비교한다
  const schema = await call(`data_sources/${dsId}`);
  const names = Object.keys(schema.body.properties ?? {});
  const trimmed = new Set(names.map((n) => n.trim()));
  for (const req of db.required) {
    const allowed = Array.isArray(req) ? req : [req];
    const found = allowed.some((name) => trimmed.has(name));
    const label = allowed.map((name) => `\`${name}\``).join(" 또는 ");
    note(found, `필수 열 ${label}${found ? "" : " 없음 — 이 DB 는 화면에 안 나옵니다"}`);
  }
  const missingOptional = db.optional.filter((n) => !trimmed.has(n));
  if (missingOptional.length) {
    console.log(`   · 없는 선택 열: ${missingOptional.map((n) => `\`${n}\``).join(", ")}`);
  }
  const untrimmed = names.filter((n) => n !== n.trim());
  if (untrimmed.length) {
    console.log(`   · 이름 앞뒤에 공백이 있는 열: ${untrimmed.map((n) => JSON.stringify(n)).join(", ")} (코드가 흡수하지만 고쳐 두는 편이 낫습니다)`);
  }

  // 행 · 순서
  const rows = await call(`data_sources/${dsId}/query`, {
    method: "POST",
    body: JSON.stringify({
      page_size: 100,
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
    }),
  });
  const results = rows.body.results ?? [];
  console.log(`   · 행 ${results.length}건${rows.body.has_more ? "+ (100건 초과)" : ""}`);

  if (db.orderBy === "순서" && results.length) {
    const hasOrder = trimmed.has("순서");
    const withOrder = results.map((p) => {
      const entry = Object.entries(p.properties ?? {}).find(([k]) => k.trim() === "순서");
      return { title: rowTitle(p), order: entry?.[1]?.number ?? null };
    });
    // 동점 처리는 각 조회 함수와 같게 맞춘다 (가이드만 제목 가나다순)
    withOrder.sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        (db.tiebreak === "title" ? a.title.localeCompare(b.title, "ko") : 0),
    );
    console.log(
      `   · 화면 순서 (${hasOrder ? "`순서` 열 기준" : "만든 순서 — `순서` 열 없음"}):\n     ` +
        withOrder
          .map((r) => (r.order === null ? r.title : `${r.order}. ${r.title}`))
          .join(" → "),
    );
    if (hasOrder) {
      const blanks = withOrder.filter((r) => r.order === null);
      if (blanks.length === withOrder.length) {
        console.log(
          `   · ⚠ \`순서\` 열이 있지만 ${blanks.length}건 모두 비어 있습니다 —` +
            ` 지금 순서는 ${db.tiebreak === "title" ? "제목 가나다순" : "만든 순서"}입니다`,
        );
      } else if (blanks.length) {
        console.log(
          `   · ⚠ \`순서\` 가 빈 행 ${blanks.length}건은 맨 뒤로 갑니다: ${blanks.map((r) => r.title).join(", ")}`,
        );
      }
    } else {
      console.log("   · ⚠ 노션에서 줄을 드래그한 순서는 API 로 알 수 없습니다. 순서를 직접 정하려면 `순서` 숫자 열을 만드세요.");
    }
  }

  console.log();
}

console.log(
  problems === 0
    ? "✅ 문제 없음"
    : `❌ 확인이 필요한 항목 ${problems}건 (위의 ✗ 참고)`,
);
process.exit(problems === 0 ? 0 : 1);
