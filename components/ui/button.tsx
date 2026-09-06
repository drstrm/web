import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * 버튼 (모든 화면의 눌리는 요소가 여기를 지난다)
 * ------------------------------------------------------------------
 * 글자가 정확히 가운데 오도록 하는 규칙을 한곳에 못박아 둔다.
 *
 * · `inline-flex items-center justify-center` — 가로·세로 모두 중앙
 * · `[&_svg]:size-3.5 [&_svg]:shrink-0`      — 아이콘 크기를 버튼이 정한다
 * · 높이는 `h-*` 로 고정하고 `leading-none` 으로 줄간격을 없앤다
 * · 아이콘은 옆 글자와 같은 크기로 둔다 — 아이콘이 더 크면 글자가 딸려 보인다
 *
 * 이모지를 쓰지 않는 이유가 여기 있다. 이모지는 폰트마다 글자 상자보다 크게
 * 그려지고 베이스라인도 제각각이라, 같은 `items-center` 를 줘도 옆의 한글보다
 * 몇 px 씩 내려앉는다. lucide 아이콘은 크기가 지정된 SVG 라 그 어긋남이 없다.
 *
 * asChild 로 감싸면 스타일만 물려주고 요소는 자식(SmartLink 등)이 그대로 쓴다.
 */
const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl",
    "font-bold leading-none transition-all duration-200",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55",
    "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        /** 주 동작. 스카이 그라디언트 */
        primary: "sky-gradient text-white shadow-[0_6px_18px_-6px_rgb(2_132_199/0.55)] hover:brightness-105",
        /** 포인트 동작 — 펄 네온 샴페인. 글자는 반드시 champagne-ink */
        accent:
          "champagne-gradient text-champagne-ink shadow-[0_6px_18px_-6px_rgb(163_203_6/0.7)] hover:brightness-[1.04]",
        /** 흰 배경 + 테두리 */
        outline:
          "border border-border-strong bg-surface text-foreground shadow-sm hover:border-sky-300 hover:bg-sky-50",
        /** 옅은 스카이 채움 */
        soft: "bg-sky-50 text-sky-700 hover:bg-sky-100",
        /** 배경 없음 */
        ghost: "text-muted hover:bg-sky-50 hover:text-sky-700",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-sm",
        /** 정사각 아이콘 버튼 — 아이콘 하나만 담는다 */
        icon: "size-10 rounded-xl p-0 [&_svg]:size-[18px]",
        "icon-sm": "size-8 rounded-lg p-0 [&_svg]:size-3.5",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 자식 요소(링크 등)에 버튼 스타일만 입힌다 */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      // asChild 로 <a> 를 감쌀 때 type 을 넘기면 잘못된 속성이 된다
      {...(asChild ? {} : { type: type ?? "button" })}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
