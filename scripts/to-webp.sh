#!/usr/bin/env bash
#
# jpg/png -> webp 변환 스크립트
#
# 사용법:
#   scripts/to-webp.sh [옵션] <파일 또는 디렉터리> ...
#
# 옵션:
#   -q, --quality <1-100>  변환 품질 (기본: 82)
#   -d, --delete           변환 성공 시 원본 삭제 (기본: 원본 유지)
#   -f, --force            이미 .webp가 있어도 다시 변환
#   -n, --dry-run          실제 변환 없이 대상만 출력
#   -h, --help             도움말
#
# 예시:
#   scripts/to-webp.sh public/streaming_guide
#   scripts/to-webp.sh -q 90 -d public/icons public/banner.jpg
#
set -euo pipefail

QUALITY=82
DELETE_ORIGINAL=0
FORCE=0
DRY_RUN=0
TARGETS=()

# webp 스펙상 한 변의 최대 픽셀
WEBP_MAX_DIM=16383

usage() {
  cat <<'EOF'
jpg/png -> webp 변환 스크립트

사용법:
  scripts/to-webp.sh [옵션] <파일 또는 디렉터리> ...

옵션:
  -q, --quality <1-100>  변환 품질 (기본: 82)
  -d, --delete           변환 성공 시 원본 삭제 (기본: 원본 유지)
  -f, --force            이미 .webp가 있어도 다시 변환
  -n, --dry-run          실제 변환 없이 대상만 출력
  -h, --help             도움말

예시:
  scripts/to-webp.sh public/streaming_guide
  scripts/to-webp.sh -q 90 -d public/icons public/banner.jpg
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -q|--quality) QUALITY="$2"; shift 2 ;;
    -d|--delete)  DELETE_ORIGINAL=1; shift ;;
    -f|--force)   FORCE=1; shift ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -h|--help)    usage 0 ;;
    -*)           echo "알 수 없는 옵션: $1" >&2; usage 1 ;;
    *)            TARGETS+=("$1"); shift ;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  echo "변환할 파일 또는 디렉터리를 지정하세요." >&2
  usage 1
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp가 필요합니다. 설치: brew install webp" >&2
  exit 1
fi

human() {
  awk -v b="$1" 'BEGIN {
    split("B KB MB GB", u, " ")
    i = 1
    while (b >= 1024 && i < 4) { b /= 1024; i++ }
    printf (i == 1 ? "%d%s" : "%.1f%s"), b, u[i]
  }'
}

filesize() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1"; }

total_before=0
total_after=0
converted=0
skipped=0
failed=0

convert_one() {
  local src="$1"
  local dst="${src%.*}.webp"

  if [[ -f "$dst" && $FORCE -eq 0 ]]; then
    echo "  건너뜀 (이미 존재): $src"
    skipped=$((skipped + 1))
    return
  fi

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] $src -> $dst"
    return
  fi

  # 초대형 이미지는 webp 한계(16383px)를 넘으면 변환이 실패하므로 미리 축소
  local resize_w=0
  local resize_h=0
  if command -v magick >/dev/null 2>&1; then
    local dims w h
    dims=$(magick identify -format '%w %h' "${src}[0]" 2>/dev/null || true)
    if [[ -n "$dims" ]]; then
      w=${dims% *}
      h=${dims#* }
      if (( w > WEBP_MAX_DIM || h > WEBP_MAX_DIM )); then
        if (( w >= h )); then
          resize_w=$WEBP_MAX_DIM
        else
          resize_h=$WEBP_MAX_DIM
        fi
        echo "  ! ${w}x${h} -> webp 최대 ${WEBP_MAX_DIM}px 로 축소"
      fi
    fi
  fi

  local ok=1
  if (( resize_w > 0 || resize_h > 0 )); then
    cwebp -quiet -q "$QUALITY" -m 4 -mt -resize "$resize_w" "$resize_h" "$src" -o "$dst" || ok=0
  else
    cwebp -quiet -q "$QUALITY" -m 4 -mt "$src" -o "$dst" || ok=0
  fi

  if (( ok == 0 )); then
    echo "  x 변환 실패: $src" >&2
    rm -f "$dst"
    failed=$((failed + 1))
    return
  fi

  local before after
  before=$(filesize "$src")
  after=$(filesize "$dst")
  total_before=$((total_before + before))
  total_after=$((total_after + after))
  converted=$((converted + 1))

  printf '  ✓ %s\n    %s -> %s (%d%% 감소)\n' \
    "$(basename "$dst")" "$(human "$before")" "$(human "$after")" \
    "$(( (before - after) * 100 / before ))"

  if [[ $DELETE_ORIGINAL -eq 1 ]]; then
    rm -f "$src"
    echo "    원본 삭제됨"
  fi
}

for target in "${TARGETS[@]}"; do
  if [[ -d "$target" ]]; then
    echo "디렉터리: $target"
    while IFS= read -r -d '' file; do
      convert_one "$file"
    done < <(find "$target" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)
  elif [[ -f "$target" ]]; then
    case "$(printf '%s' "$target" | tr '[:upper:]' '[:lower:]')" in
      *.jpg|*.jpeg|*.png) echo "파일: $target"; convert_one "$target" ;;
      *) echo "지원하지 않는 형식(건너뜀): $target"; skipped=$((skipped + 1)) ;;
    esac
  else
    echo "찾을 수 없음: $target" >&2
    failed=$((failed + 1))
  fi
done

echo
if [[ $DRY_RUN -eq 1 ]]; then
  echo "dry-run 완료 (실제 변환 없음)"
  exit 0
fi
echo "완료: 변환 ${converted}건, 건너뜀 ${skipped}건, 실패 ${failed}건"
if [[ $converted -gt 0 ]]; then
  echo "용량: $(human "$total_before") -> $(human "$total_after") ($(( (total_before - total_after) * 100 / total_before ))% 감소)"
fi
