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
        <ChevronDown
          aria-hidden
          className="ml-auto size-4 shrink-0 text-sky-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
          strokeWidth={2.4}
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
