"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 모달 (라디오 사연 팝업)
 * ------------------------------------------------------------------
 * Radix 가 포커스 가둠 · Esc 닫기 · 배경 스크롤 잠금 · aria-modal 을 맡는다.
 * 모바일에서는 바닥에서 올라오는 시트, 데스크톱에서는 가운데 카드로 보인다.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { children: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[#0d1a2b]/50 backdrop-blur-sm",
          "data-[state=open]:animate-[overlay-in_180ms_ease-out]",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden",
          "rounded-t-3xl border border-border bg-surface shadow-lift",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg",
          "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          "data-[state=open]:animate-[sheet-in_220ms_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** 오른쪽 위 닫기 버튼 */
export function DialogCloseButton() {
  return (
    <DialogPrimitive.Close
      aria-label="닫기"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl border border-border",
        "text-muted transition-colors hover:bg-sky-50 hover:text-sky-700",
      )}
    >
      <X className="size-3.5" strokeWidth={2.5} />
    </DialogPrimitive.Close>
  );
}
