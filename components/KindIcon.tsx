import { createElement } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import { iconOf } from "@/lib/kind-icon";
import { cn } from "@/lib/utils";

/**
 * 일정 · 할일 항목의 아이콘 한 개.
 * ------------------------------------------------------------------
 * 세 곳에서 올 수 있는 아이콘을 한 규칙으로 정리한다.
 *
 *   1. public/icons/<플랫폼>.png  — 멜론 · 뮤빗 처럼 브랜드가 뚜렷한 것
 *   2. 노션 `emoji` 열           — 운영진이 직접 골라 적은 값
 *   3. 종류별 lucide 아이콘        — 위 둘이 없을 때의 기본값
 *
 * 이모지가 남는 건 2번뿐이고, 그때도 `leading-none` 을 준 flex 상자 안에
 * 중앙 정렬해서 옆 글자와 어긋나지 않게 한다.
 */
export default function KindIcon({
  iconType,
  emoji,
  kind,
  size = 24,
  className,
}: {
  /** 노션 `플랫폼` 값 = public/icons 파일명 */
  iconType?: string | null;
  /** 노션 `emoji` 열 */
  emoji?: string;
  /** 노션 `종류` 값 */
  kind: string;
  size?: number;
  className?: string;
}) {
  return (
    <PlatformIcon
      iconType={iconType}
      size={size}
      className={className}
      fallback={
        emoji ? (
          <span
            aria-hidden
            className="flex items-center justify-center leading-none"
            /* 상자의 48% — lucide 아이콘(40%)보다 살짝 크게 둔다. 이모지는
               글리프 안쪽에 여백이 있어 같은 px 로는 더 작아 보인다 */
            style={{ fontSize: Math.round(size * 0.48) }}
          >
            {emoji}
          </span>
        ) : (
          /*
           * 맵에서 꺼낸 아이콘이라 매 렌더마다 같은 함수다. JSX 로 쓰면
           * 린트가 「렌더 중 컴포넌트 생성」으로 오해하므로 createElement 로 그린다.
           */
          createElement(iconOf(kind), {
            className: cn("text-sky-600", className),
            strokeWidth: 2.2,
          })
        )
      }
    />
  );
}
