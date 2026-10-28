"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * 드롭다운 메뉴 (헤더 언어 스위치)
 * ------------------------------------------------------------------
 * 모양은 헤더 데스크톱 내비의 하위 메뉴와 **같은 토큰**을 쓴다
 * (`rounded-2xl border-border bg-surface p-1.5 shadow-lift`). 내비 쪽은 CSS
 * hover 만으로 열리는 순수 표현이라 Radix 를 쓰지 않지만, 이쪽은 **눌러서**
 * 열고 항목을 골라야 해서 키보드 · 스크린리더 · 외부 클릭 처리가 필요하다.
 *
 * Radix 가 맡는 것: Esc 닫기 · 방향키 이동 · 외부 클릭 · 포커스 복귀 ·
 * aria-expanded/haspopup · **화면 끝 충돌 회피**(모바일에서 오른쪽으로 넘치지
 * 않게 알아서 뒤집는다 — 이게 직접 구현했을 때 가장 자주 깨지는 부분이다).
 */
export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-48 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lift",
          // 열릴 때만 살짝 떠오른다. 닫힘은 즉시 — 메뉴가 사라지길 기다리게 하지 않는다
          "data-[state=open]:animate-[dropdown-in_140ms_ease-out]",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  active,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item> & { active?: boolean }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2.5",
        "text-sm font-semibold outline-none transition-colors",
        // 마우스 hover 와 키보드 포커스가 같은 모양이어야 한다 (Radix 가 highlighted 를 준다)
        active
          ? "bg-sky-50 text-sky-700"
          : "text-foreground data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-700",
        className,
      )}
      {...props}
    />
  );
}
