#!/usr/bin/env node
/*
 * 라디오 사연 — 그날 문장 풀을 수파베이스에 넣는다
 * ------------------------------------------------------------------
 * 매일 00시(KST) 예약 작업이 문장을 JSON 으로 써 두고 이 스크립트를 부른다.
 * 규칙은 docs/radio-message-prompt.md, 테이블은 sql/radio_messages.sql.
 *
 *   node scripts/radio-daily-insert.mjs <file.json> [--dry-run] [--preview]
 *
 *   --dry-run  검사만 하고 쓰지 않는다
 *   --preview  문장마다 「DJ 있음(받침 있는 · 없는 호칭)」「DJ 없음」으로 바꿔 본 결과를 출력한다
 *              — 호칭이 지워졌을 때 말이 되는지는 기계가 못 보니 눈으로 확인한다
 *
 * file.json:
 *   {
 *     "date": "2026-11-12",                 // KST 오늘
 *     "context": "평일 · 서울 맑음 3~12℃",   // 반영한 이벤트 · 날씨 (기록용)
 *     "messages": {
 *       "morning": ["…", …], "lunch": […], "afternoon": […],
 *       "evening": […], "night": […], "all": […]
 *     }
 *   }
 *
 * 문장 하나라도 규칙에 어긋나면 **아무것도 쓰지 않고** 이유를 출력한 뒤 1 로 끝난다.
 * 통과하면 그 날짜의 기존 줄을 지우고 새로 넣는다 — 같은 날 다시 돌려도 안전하다.
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SECRET_KEY (쓰기용. 사이트에는 넣지 않는다)
 */

import { readFileSync } from "node:fs";

const SLOTS = ["morning", "lunch", "afternoon", "evening", "night", "all"];
// 50개씩 쓰라고 하고, 몇 개 버려져도 통과하게 조금 낮춰 둔다
const MIN_PER_SLOT = 45;

// ↓ lib/radio-message.ts 의 JOSA · PLAIN_JOSA · renderMessage 와 같아야 한다 (고치면 같이 고친다)
const JOSA = {
  은는: ["은", "는"], 이가: ["이", "가"], 을를: ["을", "를"], 와과: ["과", "와"],
  이랑: ["이랑", "랑"], 으로: ["으로", "로"], 이나: ["이나", "나"],
};
const PLAIN_JOSA = ["께서", "에게", "한테", "의", "도", "만", "께"];
const JOSA_KEYS = Object.keys(JOSA);
const J = JOSA_KEYS.join("|");
const P = PLAIN_JOSA.join("|");
const REMOVE_DJ = new RegExp(`\\$\\{dj_name\\}(?:\\$\\{(?:${J})\\}|${P})?[~!,\\s]*`, "g");
const BAD_AFTER_DJ = new RegExp(`\\$\\{dj_name\\}(?!$|[~!,\\s]|\\$\\{(?:${J})\\}|(?:${P})(?=$|[\\s~!,.?]))`);
const JOSA_NOT_AFTER_DJ = new RegExp(`(?<!\\$\\{dj_name\\})\\$\\{(?:${J})\\}`);

function render(template, dj) {
  if (!dj) return template.replace(REMOVE_DJ, "").replace(/\s{2,}/g, " ").trim();
  const code = dj.charCodeAt(dj.length - 1);
  const jong = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 : 0;
  return template.replace(/\$\{([^}]+)\}/g, (_, k) => {
    if (k === "dj_name") return dj;
    const batchim = k === "으로" ? jong !== 0 && jong !== 8 : jong !== 0;
    return JOSA[k][batchim ? 0 : 1];
  });
}
// ↑ 여기까지
const SONGS = ["NCT DREAM의 Boogie Woogie", "엔시티 드림의 부기우기"];
// docs/radio-message-prompt.md 「쓰지 말 것」 + 지난 표기
const BANNED = [
  "텐션", "에너지", "충전", "완벽", "최고", "기분 전환", "힐링", "살아나", "살아났",
  "강력 추천", "많은 분들이 들어주", "신청곡:", "신청곡 :", "BoogieWoogie",
  // 2026-04 마크 탈퇴 이후 6인 체제
  "칠드림", "7드림", "7DREAM",
  // 멤버 이름 (사연에 멤버를 언급하지 않는다)
  "런쥔", "제노", "해찬", "재민", "천러", "지성",
  // 다른 가수 · 그룹과 비교하는 말
  "다른 팀", "다른 그룹", "타팀", "갈아탔", "갈아타",
];
// 「마크」는 북마크 · 랜드마크 같은 낱말은 빼고 잡는다
const MARK = /(?<!북|드)마크/;
// ㅋㅋ · ㅎㅎ · ㅠㅠ · ㅜㅜ 한 덩어리
const LAUGH = /[ㅋㅎㅠㅜ]{2,}/g;
// 칸마다 이 비율을 넘으면 남발로 본다 (규칙은 「절반 이하」)
const MAX_LAUGH_RATIO = 0.5;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const preview = args.includes("--preview");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("사용법: node scripts/radio-daily-insert.mjs <file.json> [--dry-run]");
  process.exit(2);
}

const input = JSON.parse(readFileSync(file, "utf8"));
const errors = [];

/* ---------- 날짜 ---------- */

const kstToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "")) {
  errors.push(`date 형식이 YYYY-MM-DD 가 아님: ${input.date}`);
} else if (input.date !== kstToday) {
  errors.push(`date(${input.date}) 가 KST 오늘(${kstToday}) 이 아님`);
}

/* ---------- 문장 ---------- */

function checkText(slot, text) {
  const where = `[${slot}] ${text.slice(0, 40)}…`;
  const fail = (why) => errors.push(`${where}\n    → ${why}`);

  if (typeof text !== "string") return fail("문자열이 아님");
  if (text.includes("\n")) fail("줄바꿈이 있음");
  if (text.length < 40 || text.length > 250) fail(`길이 ${text.length}자 (40~250)`);

  const keys = [...text.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]);
  const unknown = keys.filter((k) => k !== "dj_name" && !JOSA_KEYS.includes(k));
  if (unknown.length) fail(`모르는 자리표시자: ${unknown.join(", ")}`);
  const djCount = keys.filter((k) => k === "dj_name").length;
  if (djCount !== 1) fail(`\${dj_name} 이 ${djCount}번 (정확히 1번)`);
  if (BAD_AFTER_DJ.test(text)) {
    fail(`\${dj_name} 바로 뒤에 올 수 없는 글자 (허용: 공백 · ~ ! , · 조사 자리표시자 · ${PLAIN_JOSA.join(" ")})`);
  }
  // 조사 자리표시자는 호칭 바로 뒤에서만 의미가 있다
  if (JOSA_NOT_AFTER_DJ.test(text)) fail("조사 자리표시자가 호칭 바로 뒤에 있지 않음");

  if (!SONGS.some((s) => text.includes(s))) fail(`곡 표기가 없음 (${SONGS.join(" / ")})`);
  for (const w of BANNED) if (text.includes(w)) fail(`쓰지 말 표현: "${w}"`);
  if (MARK.test(text)) fail("탈퇴한 멤버(마크) 언급");
  // 음슴체 금지 — "~했음ㅋㅋ", "~있음.", "듣는 중ㅎㅎ" 처럼 명사형으로 끝내는 말
  if (/(?:했|였|됐|었|았|있|없|겠|밌)음(?=[ㅋㅎㅠㅜ.!?~\s]|$)|는 중(?=[ㅋㅎㅠㅜ.!?~]|$)/.test(text)) fail("음슴체");
  if ((text.match(/!/g) ?? []).length > 2) fail("느낌표가 너무 많음");
  if ((text.match(LAUGH) ?? []).length > 1) fail("ㅋㅋ · ㅎㅎ · ㅠㅠ 는 한 문장에 한 번만");
  if (/(?:어|에|네|해|죠|래|게)용(?=[^가-힣]|$)/.test(text)) fail("~용 말투");
  if (/(?:어|아)여(?=[^가-힣]|$)|슴다|다구요/.test(text)) fail("~여 · ~슴다 · ~다구요 말투");
}

const messages = input.messages ?? {};
for (const key of Object.keys(messages)) {
  if (!SLOTS.includes(key)) errors.push(`모르는 칸: ${key}`);
}
const seen = new Set();
for (const slot of SLOTS) {
  const list = messages[slot];
  if (!Array.isArray(list) || list.length < MIN_PER_SLOT) {
    errors.push(`[${slot}] 문장이 ${MIN_PER_SLOT}개 미만`);
    continue;
  }
  // .test 는 g 플래그가 붙은 정규식의 lastIndex 를 움직이므로 g 없는 것으로 센다
  const laughing = list.filter((t) => typeof t === "string" && /[ㅋㅎㅠㅜ]{2,}/.test(t)).length;
  if (laughing / list.length > MAX_LAUGH_RATIO) {
    errors.push(`[${slot}] ㅋㅋ · ㅎㅎ · ㅠㅠ 가 들어간 문장이 ${laughing}/${list.length}개 — ${Math.round(MAX_LAUGH_RATIO * 100)}% 이하로`);
  }
  for (const raw of list) {
    const text = typeof raw === "string" ? raw.trim() : raw;
    checkText(slot, text);
    if (seen.has(text)) errors.push(`[${slot}] 중복 문장: ${String(text).slice(0, 40)}…`);
    seen.add(text);
  }
}

if (preview) {
  for (const slot of SLOTS) {
    for (const t of messages[slot] ?? []) {
      if (typeof t !== "string") continue;
      console.log(`[${slot}]\n  완디: ${render(t, "완디")}\n  영준: ${render(t, "영준")}\n  없음: ${render(t, null)}`);
    }
  }
  console.log("");
}

if (errors.length) {
  console.error(`검사 실패 ${errors.length}건 — 아무것도 쓰지 않았습니다.\n`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

const rows = SLOTS.flatMap((slot) =>
  messages[slot].map((text) => ({
    date: input.date,
    time_slot: slot,
    text: text.trim(),
    context: input.context ?? null,
  })),
);

const summary = SLOTS.map((s) => `${s} ${messages[s].length}`).join(" · ");
if (dryRun) {
  console.log(`검사 통과 (dry-run, 쓰지 않음): ${input.date} — ${summary}`);
  process.exit(0);
}

/* ---------- 쓰기 ---------- */

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!BASE || !KEY) {
  console.error("SUPABASE_URL · SUPABASE_SECRET_KEY 환경변수가 없습니다.");
  process.exit(2);
}

// 새 형식 키(sb_secret_…)는 apikey 헤더만 받는다. 예전 JWT 형식(service_role)은 Bearer 도 필요하다.
const headers = {
  apikey: KEY,
  "Content-Type": "application/json",
  ...(KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${KEY}` }),
};
const url = `${BASE}/rest/v1/radio_messages`;

async function call(method, query, body) {
  const res = await fetch(`${url}${query}`, {
    method,
    headers: { ...headers, Prefer: "return=minimal" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${method} ${res.status}: ${detail.slice(0, 300)}`);
  }
}

await call("DELETE", `?date=eq.${input.date}`);
await call("POST", "", rows);
console.log(`저장 완료: ${input.date} — ${summary} (총 ${rows.length}줄)`);
