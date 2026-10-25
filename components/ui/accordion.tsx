"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * 접히는 목록 (스밍리스트 · 라디오 편성표)
 * ------------------------------------------------------------------
 * Radix 를 쓰면 `aria-expanded` · `aria-controls` · 방향키 이동 · 열림 애니메이션이
 * 전부 따라온다. 직접 useState 로 만들던 것을 대체한다.
 */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
        "transition-colors data-[state=open]:border-sky-200",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-sky-50/60 data-[state=open]:bg-sky-50/40",
          className,
        )}
        {...props}
      >
        {children}
        {/*
         * 화살표는 옆 글자와 비슷한 크기로 둔다. 셰브런은 상자 높이의 3/8 만 차지하는
         * 모양이라(viewBox 24 중 9), size-4 로 두면 상자만 16px 이고 실제로 보이는 V 는
         * 6px 남짓이다 — 글자 옆에서 혼자 작아 보이던 이유다. 상자를 24px 로 키우면
         * V 가 9px 쯤 되어 14px 글자의 높이와 맞는다. 커진 만큼 선은 살짝 얇게.
         */}
        <ChevronDown
          aria-hidden
          className="ml-auto size-6 shrink-0 text-sky-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
          strokeWidth={2.2}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden border-t border-border bg-background",
        "data-[state=closed]:animate-[accordion-up_200ms_ease-out]",
        "data-[state=open]:animate-[accordion-down_220ms_ease-out]",
      )}
      {...props}
    >
      <div className={className}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
