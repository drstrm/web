#!/usr/bin/env node
/*
 * 라디오 선곡 확인 — 신청곡이 오늘 나왔는지 방송사 선곡표를 보고 수파베이스에 남긴다
 * ------------------------------------------------------------------
 * 사이트(app/api/radio-message)는 `radio_played` 의 오늘 줄을 읽어, 신청곡이 나온 채널 버튼을
 * 그날 하루 「선곡완료」로 막는다. 이 스크립트를 주기적으로(예: 10~30분마다) 돌린다.
 *
 *   node scripts/radio-played-check.mjs [--dry-run] [--date=YYYY-MM-DD]
 *
 * 지금 확인하는 곳: **SBS 만** (파워FM · 러브FM).
 *   SBS 프로그램 홈페이지의 「라디오 선곡표」가 쓰는 공개 API 다. 곡이 나간 지 몇 분 안에 올라온다.
 *     https://apis.sbs.co.kr/radio-api/playlist/{VOD_ID}/{YYYYMMDD}
 *   KBS · MBC 선곡표는 브라우저에서만 그려지는 화면이라 아직 못 읽는다 — 그 채널은 수파베이스
 *   Table Editor 에서 줄을 직접 넣는다(source = 'manual').
 *
 * 프로그램 목록은 신청 가능성이 있는(possibility ≥ 1) SBS 편성만 적었다 (lib/radio.ts · lib/radio-programs.ts).
 * VOD_ID 는 https://static.apis.sbs.co.kr/program-api/1.0/menu/{프로그램 코드} 의 program.vodid.
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SECRET_KEY (쓰기용. --dry-run 이면 필요 없다)
 */

const SBS_PROGRAMS = [
  // 파워FM #1077
  { station: "#1077", program: "애프터 클럽", vodId: "V0000376639" },
  { station: "#1077", program: "이인권의 펀펀투데이", vodId: "22000014184" },
  { station: "#1077", program: "김영철의 파워 FM", vodId: "V2000009984" },
  { station: "#1077", program: "아름다운 이 아침, 봉태규입니다", vodId: "22000014741" },
  { station: "#1077", program: "12시엔 주현영", vodId: "22000015165" },
  { station: "#1077", program: "두시탈출 컬투쇼", vodId: "V0000328482" },
  { station: "#1077", program: "황제성의 황제파워", vodId: "22000012849" },
  { station: "#1077", program: "박소현의 러브게임", vodId: "V0000336099" },
  { station: "#1077", program: "웬디의 영스트리트", vodId: "22000012201" },
  { station: "#1077", program: "배성재의 텐", vodId: "V2000009300" },
  { station: "#1077", program: "딘딘의 뮤직하이", vodId: "22000011911" },
  // 러브FM #1035
  { station: "#1035", program: "DJ래피의 드라이브 뮤직", vodId: "V2000011017" },
  { station: "#1035", program: "그대의 오후, 정엽입니다", vodId: "22000014305" },
  { station: "#1035", program: "김윤상의 뮤직투나잇", vodId: "22000016421" },
  { station: "#1035", program: "음악이 흐르는 밤, 박은경입니다", vodId: "22000016861" },
];

/** 띄어쓰기 · 문장부호 · 대소문자를 지우고 비교한다 ("Boogie Woogie" = "BoogieWoogie" = "boogie-woogie") */
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
const ARTISTS = ["nctdream", "nct드림", "엔시티드림"];
const TITLES = ["boogiewoogie", "부기우기"];

function isRequestSong(item) {
  const artist = norm(`${item.ARTIST_NAME} ${item.DISPLAY_NAME}`);
  const title = norm(item.SONG_TITLE);
  return ARTISTS.some((a) => artist.includes(a)) && TITLES.some((t) => title.includes(t));
}

/** 20261110200121 (KST) → ISO */
function kstStampToIso(n) {
  const s = String(n ?? "");
  if (!/^\d{14}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+09:00`;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dateArg = args.find((a) => a.startsWith("--date="))?.slice(7);
const today =
  dateArg ??
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
const ymd = today.replaceAll("-", "");

/* ---------- 확인 ---------- */

const found = new Map(); // station → row (채널마다 그날 첫 번째 것만)
const failures = [];

for (const p of SBS_PROGRAMS) {
  const url = `https://apis.sbs.co.kr/radio-api/playlist/${p.vodId}/${ymd}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const list = body?.data?.playlist ?? [];
    const hit = list.find(isRequestSong);
    console.log(`${hit ? "★" : " "} ${p.station} ${p.program} — ${list.length}곡${hit ? ` · ${hit.ARTIST_NAME} - ${hit.SONG_TITLE}` : ""}`);
    if (hit && !found.has(p.station)) {
      found.set(p.station, {
        date: today,
        station: p.station,
        program: p.program,
        played_at: kstStampToIso(hit.START_TIME),
        source: `https://programs.sbs.co.kr/radio (playlist ${p.vodId})`,
      });
    }
  } catch (err) {
    failures.push(`${p.program}: ${err.message}`);
    console.log(`! ${p.station} ${p.program} — 확인 실패 (${err.message})`);
  }
}

const rows = [...found.values()];
console.log(`\n${today}: 신청곡이 나온 채널 ${rows.length}곳${rows.length ? ` (${rows.map((r) => r.station).join(", ")})` : ""}`);
if (failures.length) console.log(`확인 실패 ${failures.length}곳 — 다음 실행 때 다시 본다`);

if (dryRun || rows.length === 0) process.exit(0);

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
  // (date, station) 이 이미 있으면 그대로 둔다 — 그날 처음 확인된 기록이 남는다
  Prefer: "resolution=ignore-duplicates,return=minimal",
  ...(KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${KEY}` }),
};

const res = await fetch(`${BASE}/rest/v1/radio_played?on_conflict=date,station`, {
  method: "POST",
  headers,
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error(`저장 실패 ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  process.exit(1);
}
console.log("저장 완료");
