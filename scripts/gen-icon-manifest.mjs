#!/usr/bin/env node
/*
 * public/icons 매니페스트 생성기
 * ------------------------------------------------------------------
 * public/icons 를 훑어서 「아이콘 키 → 실제 파일 이름」 맵을 lib/icon-manifest.ts
 * 로 써 넣는다. 키는 파일 이름에서 **끝의 버전 꼬리표(`_2611`)와 확장자를 떼어낸**
 * 값이다 (`melon_2611.png` → `melon`, `shop-yes24_2612.png` → `shop-yes24`).
 *
 * 왜 필요한가
 *   정적 파일 주소에는 노션 이미지의 `v` 토큰(lib/notion.ts 의 versionToken)처럼
 *   내용에 따라 바뀌는 조각이 없다. 그런데 최적화 결과를 1년 캐시하고
 *   (next.config.ts 의 minimumCacheTTL) 파일도 immutable 로 내보내므로, 같은
 *   이름으로 덮으면 최대 1년간 옛 아이콘이 남는다. 그래서 교체는 「덮어쓰기」가
 *   아니라 「꼬리표를 올린 새 파일로 바꿔치기」로 한다.
 *
 *   꼬리표를 코드에 적으면 아이콘 **한 장만** 갈 때도 29개 파일명을 전부 맞춰야
 *   한다. 그 대신 꼬리표를 파일 쪽에만 두고, 키와의 연결을 빌드 때 이 스크립트가
 *   만든다 — 파일마다 꼬리표가 달라도 된다.
 *
 * 왜 빌드 때 하나
 *   <PlatformIcon> 은 클라이언트 컴포넌트(AlbumShops · Calendar · StreamingLists
 *   · TodoChecklist · VoteApps)에서도 렌더된다. 브라우저에는 디렉터리 목록이
 *   없으므로 런타임에 파일명을 찾을 수 없다.
 *
 * 사용법
 *   node scripts/gen-icon-manifest.mjs           # 생성 (pnpm dev · build 가 먼저 돌린다)
 *   node scripts/gen-icon-manifest.mjs --check    # 생성물이 최신인지만 검사 (CI)
 *
 * 멈추는 경우와 경고만 하는 경우
 *   멈춤(exit 1): 한 키에 파일이 둘 — 어느 쪽이 맞는지 코드가 알 수 없다.
 *   경고(exit 0): 키가 목록(PLATFORM_ICONS · ALBUM_SHOP_ICONS)과 어긋남.
 *     「파일은 있는데 목록에 없음」은 꼬리표를 `_v2` 처럼 숫자 아닌 값으로 붙였을 때
 *     생긴다 — 키가 `melon_v2` 가 되어 **에러 없이 아이콘만 사라지는** 가장 고약한
 *     실패라서, 조용히 넘기지 않고 여기서 떠든다. 「목록에는 있는데 파일이 없음」은
 *     <PlatformIcon> 이 fallback 을 그려 화면이 깨지지 않으므로 경고로 둔다.
 *     둘 다 빌드를 막지는 않는다 — 아이콘 하나 때문에 배포가 멈추면 손해가 더 크다.
 *
 * 아이콘을 추가·교체하는 법
 *   추가: public/icons 에 <키>_<YYMM>.png 를 넣고 lib/platform-icons.ts 에 한 줄
 *         (판매처 로고는 lib/album.ts). 꼬리표 없이 <키>.png 로 넣어도 동작한다.
 *   교체: 꼬리표를 올린 새 파일을 넣고 **옛 파일을 지운다.** 둘을 같이 두면 어느
 *         쪽이 맞는지 알 수 없으므로 이 스크립트가 에러로 멈춘다.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_DIR = join(ROOT, "public", "icons");
const OUT = join(ROOT, "lib", "icon-manifest.ts");

/** next/image 로 내보낼 수 있는 확장자. .DS_Store 같은 군더더기를 여기서 거른다 */
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
/** 이름 끝의 버전 꼬리표 (`_2611` · `_20261108`). 숫자만 꼬리표로 본다 */
const VERSION_SUFFIX = /_\d+$/;

const files = readdirSync(ICON_DIR).filter((f) => IMAGE_EXT.test(f)).sort();

/** 키 → 파일명. 한 키에 두 파일이 걸리면 멈춘다 (옛 파일을 안 지운 상태) */
const byKey = new Map();
for (const file of files) {
  const key = file.replace(IMAGE_EXT, "").replace(VERSION_SUFFIX, "");
  const seen = byKey.get(key);
  if (seen) {
    console.error(
      `[icon-manifest] 키 "${key}" 에 파일이 둘입니다 — ${seen} · ${file}\n` +
        `  교체라면 옛 파일을 지우세요. 다른 아이콘이라면 키가 겹치지 않게 이름을 바꾸세요.`,
    );
    process.exit(1);
  }
  byKey.set(key, file);
}

/*
 * 아이콘 키 목록과 대조한다.
 *
 * 소스를 정규식으로 읽는 느슨한 결합이라, 목록을 **한 개도** 못 읽으면(파일 구조가
 * 바뀐 경우) 29개 파일을 전부 「목록에 없다」고 떠들게 된다. 그러면 경고가 거짓말이
 * 되므로, 그때는 대조를 건너뛰고 그 사실만 알린다.
 */
function objectBlock(source, name) {
  const start = source.indexOf(`export const ${name}: Record<string, string> = {`);
  if (start < 0) return null;
  const end = source.indexOf("\n};", start);
  return end < 0 ? null : source.slice(start, end);
}

function readKeys(file, name, pattern) {
  try {
    const block = objectBlock(readFileSync(join(ROOT, file), "utf8"), name);
    return block ? [...block.matchAll(pattern)].map((m) => m[1]) : [];
  } catch {
    return [];
  }
}

// PLATFORM_ICONS 는 **속성 이름**이 키, ALBUM_SHOP_ICONS 는 **값**이 키다
// (`"예스24": "shop-yes24"` — 왼쪽은 노션에 적힌 판매처 이름이다).
const known = new Set([
  ...readKeys("lib/platform-icons.ts", "PLATFORM_ICONS", /^\s*"?([A-Za-z0-9_-]+)"?\s*:/gm),
  ...readKeys("lib/album.ts", "ALBUM_SHOP_ICONS", /:\s*"([^"]+)"/g),
]);

if (known.size === 0) {
  console.warn(
    "[icon-manifest] 키 목록을 읽지 못해 대조를 건너뜁니다 — " +
      "lib/platform-icons.ts · lib/album.ts 의 선언 형태가 바뀌었는지 확인하세요.",
  );
} else {
  for (const [key, file] of byKey) {
    if (known.has(key)) continue;
    console.warn(
      `[icon-manifest] ⚠ public/icons/${file} — 키 "${key}" 가 어느 목록에도 없어 ` +
        "화면에 나오지 않습니다.\n" +
        "  꼬리표는 `_2611` 처럼 숫자여야 합니다(`_v2` 는 이름의 일부로 읽힙니다). " +
        "아니면 lib/platform-icons.ts · lib/album.ts 에 한 줄이 빠진 것입니다.",
    );
  }
  for (const key of [...known].sort()) {
    if (byKey.has(key)) continue;
    console.warn(
      `[icon-manifest] ⚠ 키 "${key}" 는 목록에 있는데 public/icons 에 파일이 없습니다 ` +
        "— <PlatformIcon> 이 fallback 을 그립니다.",
    );
  }
}

const entries = [...byKey].sort(([a], [b]) => a.localeCompare(b));
const body = entries.map(([key, file]) => `  "${key}": "${file}",`).join("\n");

const generated = `/*
 * public/icons 파일 이름 맵 — **자동 생성 파일이므로 직접 고치지 않는다.**
 *
 * 생성: scripts/gen-icon-manifest.mjs (pnpm dev · pnpm build 가 먼저 돌린다)
 * 키는 파일 이름에서 버전 꼬리표(\`_2611\`)와 확장자를 뗀 값이고, 값은 실제 파일
 * 이름이다. 아이콘을 교체할 때 코드를 고치지 않아도 되는 이유가 이 간접층이다 —
 * 자세한 배경은 스크립트 주석 참고.
 */

/** 아이콘 키 → public/icons 의 실제 파일 이름 (\`melon\` → \`melon_2611.png\`) */
export const ICON_FILES: Record<string, string> = {
${body}
};
`;

const current = (() => {
  try {
    return readFileSync(OUT, "utf8");
  } catch {
    return null;
  }
})();

if (process.argv.includes("--check")) {
  if (current !== generated) {
    console.error(
      "[icon-manifest] lib/icon-manifest.ts 가 public/icons 와 어긋납니다. " +
        "`pnpm icons` 를 돌리고 함께 커밋하세요.",
    );
    process.exit(1);
  }
  console.log(`[icon-manifest] 최신입니다 (아이콘 ${entries.length}개)`);
} else if (current === generated) {
  console.log(`[icon-manifest] 변경 없음 (아이콘 ${entries.length}개)`);
} else {
  writeFileSync(OUT, generated);
  console.log(`[icon-manifest] lib/icon-manifest.ts 갱신 (아이콘 ${entries.length}개)`);
}
