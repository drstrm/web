import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 상태 뱃지 (오픈 예정 · 마감 · 진행중 …)
 * 아이콘을 넣어도 글자와 정확히 같은 높이에 오도록 크기를 여기서 정한다.
 */
const badgeVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "rounded-full font-bold leading-none",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        /** 포인트 — 지금 주목해야 하는 것 (진행중 투표 · 신청 가능) */
        accent: "champagne-gradient text-champagne-ink",
        /** 포인트 옅은 버전 */
        "accent-soft": "bg-champagne-100 text-champagne-800",
        sky: "bg-sky-100 text-sky-700",
        outline: "border border-border-strong bg-surface text-muted",
        muted: "bg-surface-soft text-muted",
      },
      size: {
        sm: "h-5 px-2 text-[11px] [&_svg]:size-2.5",
        md: "h-6 px-2.5 text-xs [&_svg]:size-3",
        lg: "h-7 px-3 text-xs [&_svg]:size-3",
      },
    },
    defaultVariants: { variant: "sky", size: "sm" },
  },
);

export function Badge({
  children,
  className,
  variant,
  size,
}: { children: ReactNode; className?: string } & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}

export { badgeVariants };
