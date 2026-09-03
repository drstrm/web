#!/usr/bin/env bash
#
# 노션 DB 점검 스크립트
#
# env 파일의 NOTION_*_DB_ID 로 노션에 물어 데이터 소스 ID(DS_ID)를 알아내고,
# 같은 파일의 NOTION_*_DS_ID 와 대조한다. 어긋나거나 빠진 값은 붙여넣기 좋은
# .env 블록으로 출력하고, -w 를 주면 파일에 바로 써 넣는다.
#
# DB_ID 와 DS_ID 의 차이는 docs/notion-guide-db.md 「API 버전과 데이터 소스」 참고.
# DS_ID 는 없어도 동작하지만(런타임 조회 폴백), 없으면 요청마다 왕복이 한 번 더 붙는다.
#
# 사용법:
#   scripts/notion-check.sh [옵션]
#
# 옵션:
#   -e, --env <파일>  읽을 env 파일 (기본: 저장소 루트의 .env)
#   -w, --write       조회한 DS_ID 를 env 파일에 반영 (원본은 .bak 으로 백업)
#   -h, --help        도움말
#
# 예시:
#   scripts/notion-check.sh          # 점검만 (파일을 건드리지 않는다)
#   scripts/notion-check.sh -w       # 빠지거나 어긋난 DS_ID 를 .env 에 써 넣는다
#
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ENV_FILE="$ROOT/.env"
WRITE=0

API="https://api.notion.com/v1"
# lib/notion.ts 의 NOTION_VERSION 과 같은 값이어야 한다. 응답 모양이 버전에 딸려 있다.
NOTION_VERSION="2026-03-11"

# "환경변수 접두사|표시 이름|스키마 문서" — 코드의 DATABASES(lib/notion.ts)와 짝이 맞아야 한다.
DBS=(
  "GUIDE|가이드|docs/notion-guide-db.md"
  "BANNER|홈 배너 슬라이더|docs/notion-banner-db.md"
  "STREAMING|스밍리스트 원클릭|docs/notion-streaming-db.md"
  "LINKS|메인화면 바로가기 링크|docs/notion-links-db.md"
  "SCHEDULE|캘린더 · To Do · 투표 공용 일정|docs/notion-schedule-db.md"
  "FORMS|폼 · 헬퍼 목록|docs/notion-forms-db.md"
)

usage() {
  cat <<'EOF'
노션 DB 점검 스크립트 — DB_ID 로 데이터 소스(DS_ID)를 조회해 env 파일과 대조한다.

사용법:
  scripts/notion-check.sh [옵션]

옵션:
  -e, --env <파일>  읽을 env 파일 (기본: 저장소 루트의 .env)
  -w, --write       조회한 DS_ID 를 env 파일에 반영 (원본은 .bak 으로 백업)
  -h, --help        도움말

예시:
  scripts/notion-check.sh          # 점검만 (파일을 건드리지 않는다)
  scripts/notion-check.sh -w       # 빠지거나 어긋난 DS_ID 를 .env 에 써 넣는다
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)   ENV_FILE="$2"; shift 2 ;;
    -w|--write) WRITE=1; shift ;;
    -h|--help)  usage 0 ;;
    -*)         echo "알 수 없는 옵션: $1" >&2; usage 1 ;;
    *)          echo "인자를 받지 않습니다: $1" >&2; usage 1 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "node 가 필요합니다 (응답 JSON 파싱용)." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env 파일을 찾을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

# env 파일에서 키 하나를 읽는다. 파일에 없으면 셸 환경변수를 본다(CI 등).
# 같은 키가 여러 번 나오면 마지막 정의가 이긴다 — dotenv 류와 같은 규칙.
env_get() {
  local key="$1" val=""
  val=$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)
  [[ -z "$val" ]] && val="${!key:-}"
  # 앞뒤 공백과 감싼 따옴표를 벗긴다
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  printf '%s' "$val"
}

# 노션 ID 는 하이픈이 있는 형태와 없는 형태가 섞여 쓰인다. 비교 전에 형태를 맞춘다
# (lib/notion.ts 의 bare() 와 같은 규칙).
bare() { printf '%s' "$1" | tr -d '-' | tr '[:upper:]' '[:lower:]'; }

# 응답 JSON -> "데이터소스개수 · 첫DS_ID · DB제목 · 오류메시지" 를 US(\x1f)로 이어 붙인 한 줄.
# 구분자로 탭을 쓰면 안 된다 — 탭은 IFS 공백류라 빈 칸(제목 없음 등)이 뭉개진다.
parse_db() {
  node -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  const flat = (s) => String(s ?? "").replace(/[\s\x1f]+/g, " ").trim();
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    process.stdout.write("0\x1f\x1f\x1f응답이 JSON 이 아닙니다\n");
    return;
  }
  const sources = Array.isArray(j.data_sources) ? j.data_sources : [];
  const title = Array.isArray(j.title) ? j.title.map((t) => t.plain_text).join("") : "";
  process.stdout.write(
    [sources.length, flat(sources[0] && sources[0].id), flat(title), flat(j.message)].join("\x1f") + "\n",
  );
});
'
}

TOKEN=$(env_get NOTION_TOKEN)
if [[ -z "$TOKEN" ]]; then
  echo "NOTION_TOKEN 이 없습니다: $ENV_FILE" >&2
  exit 1
fi

echo "env 파일: $ENV_FILE"
echo "노션 API 버전: $NOTION_VERSION"
echo

ok=0
stale=0
failed=0
SUGGEST=""
UPDATES=()

for entry in "${DBS[@]}"; do
  key="${entry%%|*}"
  rest="${entry#*|}"
  label="${rest%%|*}"
  doc="${rest#*|}"

  db_key="NOTION_${key}_DB_ID"
  ds_key="NOTION_${key}_DS_ID"
  db_id=$(env_get "$db_key")
  ds_env=$(env_get "$ds_key")

  echo "${label} (${doc})"

  if [[ -z "$db_id" ]]; then
    echo "  x ${db_key} 가 비어 있습니다 — 노션 DB 주소에서 ID 를 복사해 넣으세요"
    failed=$((failed + 1))
    echo
    continue
  fi

  if ! resp=$(curl -sS -m 15 -w $'\n%{http_code}' \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Notion-Version: ${NOTION_VERSION}" \
    "${API}/databases/${db_id}" 2>&1); then
    echo "  x 요청 실패 — 네트워크를 확인하세요"
    failed=$((failed + 1))
    echo
    continue
  fi

  code="${resp##*$'\n'}"
  body="${resp%$'\n'*}"

  IFS=$'\x1f' read -r count ds_api title message <<<"$(printf '%s' "$body" | parse_db)"

  if [[ "$code" != "200" ]]; then
    echo "  x HTTP ${code} — ${message:-응답 본문 없음}"
    case "$code" in
      401) echo "    NOTION_TOKEN 이 잘못됐거나 만료됐습니다" ;;
      404) echo "    DB 를 못 찾습니다. ID 오타이거나, 노션에서 이 DB 에" \
                "연결(Connections)을 안 붙였을 가능성이 큽니다" ;;
      429) echo "    요청이 너무 잦습니다. 잠시 뒤 다시 실행하세요" ;;
    esac
    failed=$((failed + 1))
    echo
    continue
  fi

  if [[ -z "$ds_api" ]]; then
    echo "  x 데이터 소스가 없습니다 (DB ${db_id})"
    failed=$((failed + 1))
    echo
    continue
  fi

  echo "  DB      ${db_id}"
  [[ -n "$title" ]] && echo "  제목    ${title}"
  echo "  DS      ${ds_api}"

  if [[ "${count:-0}" -gt 1 ]]; then
    # lib/notion.ts 의 getDataSourceId() 는 data_sources[0] 만 쓴다.
    echo "  ! 데이터 소스가 ${count}개입니다. 코드는 첫 번째만 읽으므로 의도한 것인지 확인하세요"
  fi

  if [[ -z "$ds_env" ]]; then
    echo "  ! ${ds_key} 가 비어 있습니다 — 매 요청 DB 조회 왕복이 한 번 더 붙습니다"
    stale=$((stale + 1))
  elif [[ "$(bare "$ds_env")" != "$(bare "$ds_api")" ]]; then
    echo "  x ${ds_key} 가 실제 값과 다릅니다 (env: ${ds_env})"
    stale=$((stale + 1))
  else
    echo "  ✓ ${ds_key} 일치"
    ok=$((ok + 1))
    echo
    continue
  fi

  SUGGEST="${SUGGEST}# ${label} (${doc})
${db_key}=${db_id}
${ds_key}=${ds_api}

"
  UPDATES+=("${db_key}|${ds_key}|${ds_api}")
  echo
done

echo "점검 완료: 일치 ${ok}건, 갱신 필요 ${stale}건, 실패 ${failed}건"

if [[ ${#UPDATES[@]} -gt 0 ]]; then
  if [[ $WRITE -eq 1 ]]; then
    cp "$ENV_FILE" "${ENV_FILE}.bak"
    for u in "${UPDATES[@]}"; do
      db_key="${u%%|*}"
      rest="${u#*|}"
      ds_key="${rest%%|*}"
      ds_val="${rest#*|}"
      tmp=$(mktemp)
      if grep -qE "^[[:space:]]*${ds_key}=" "$ENV_FILE"; then
        # 이미 있는 줄이면 값만 바꾼다 (주석과 순서를 그대로 둔다)
        awk -v k="$ds_key" -v v="$ds_val" '
          index($0, k "=") == 1 { print k "=" v; next }
          { print }
        ' "$ENV_FILE" >"$tmp"
      else
        # 없으면 짝이 되는 DB_ID 바로 아래에 끼워 넣는다
        awk -v dbk="$db_key" -v k="$ds_key" -v v="$ds_val" '
          { print }
          index($0, dbk "=") == 1 { print k "=" v }
        ' "$ENV_FILE" >"$tmp"
      fi
      mv "$tmp" "$ENV_FILE"
      echo "  갱신: ${ds_key}"
    done
    echo
    echo "${ENV_FILE} 를 갱신했습니다 (백업: ${ENV_FILE}.bak)"
    echo "Vercel Project Settings > Environment Variables 에도 같은 값을 넣고 재배포해야 반영됩니다."
  else
    echo
    echo "아래를 ${ENV_FILE} 에 반영하세요 (-w 를 주면 이 스크립트가 직접 써 넣습니다):"
    echo
    printf '%s' "$SUGGEST"
  fi
fi

[[ $failed -gt 0 ]] && exit 1
exit 0
