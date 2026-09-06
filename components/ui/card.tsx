import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 콘텐츠 카드. 사이트의 모든 흰 박스가 같은 모서리 · 그림자를 갖게 한다 */
export function Card({
  children,
  className,
  /** 링크 카드처럼 눌리는 카드에 호버 반응을 준다 */
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-card",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}
