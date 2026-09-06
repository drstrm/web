import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 아이콘 타일 — 목록 · 카드 왼쪽의 정사각 아이콘 자리.
 *
 * `grid place-items-center` 로 안에 무엇이 오든(lucide SVG · 플랫폼 PNG)
 * 정확히 가운데 놓고, 아이콘 크기는 타일이 정한다. 화면마다 `h-10 w-10 grid
 * place-items-center …` 를 따로 적던 것을 한 곳으로 모은 것이다.
 */
const iconTileVariants = cva(
  "grid shrink-0 place-items-center overflow-hidden [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        sky: "bg-sky-50 text-sky-600",
        accent: "champagne-gradient text-champagne-ink",
        "accent-soft": "bg-champagne-100 text-champagne-800",
        surface: "border border-border bg-surface text-sky-600",
        plain: "",
      },
      /*
       * 아이콘은 상자의 40% 안팎으로 둔다. 절반을 채우면 타일이 꽉 차 보여
       * 답답하고, 옆 글자보다 아이콘이 먼저 읽힌다. 여백이 있어야 타일이
       * 「글자를 돕는 표식」으로 보인다.
       *
       * 플랫폼 PNG(멜론 · 뮤빗 …)는 예외로 타일을 꽉 채운다 — 앱 아이콘은
       * 그림 안에 이미 여백이 들어 있어 더 줄이면 로고가 뭉갠다.
       */
      size: {
        sm: "size-8 rounded-lg [&>svg]:size-3.5",
        md: "size-10 rounded-xl [&>svg]:size-4",
        lg: "size-12 rounded-2xl [&>svg]:size-5",
        xl: "size-14 rounded-2xl [&>svg]:size-6",
      },
    },
    defaultVariants: { tone: "sky", size: "md" },
  },
);

export function IconTile({
  children,
  className,
  tone,
  size,
}: { children: ReactNode; className?: string } & VariantProps<typeof iconTileVariants>) {
  return <span className={cn(iconTileVariants({ tone, size }), className)}>{children}</span>;
}

export { iconTileVariants };
