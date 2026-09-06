import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 페이지 상단 타이틀 블록.
 * 이어브로(GUIDE · ONECLICK …)는 샴페인 점 + 그라디언트 글자로 포인트를 준다.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-2.5 flex items-center gap-2">
          <span className="champagne-glow inline-block size-1.5 rounded-full bg-champagne-400" />
          <span className="text-brand-gradient font-display text-xs font-bold uppercase tracking-[0.18em]">
            {eyebrow}
          </span>
        </p>
      )}
      <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 sm:size-10">
            <Icon className="size-4 sm:size-[18px]" strokeWidth={2.2} />
          </span>
        )}
        <span className="min-w-0">{title}</span>
      </h1>
      {description && (
        <p className="mt-2.5 text-sm leading-relaxed text-muted text-pretty sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * 섹션 제목.
 * 왼쪽 막대는 스카이 → 샴페인 그라디언트로, 화면 어디서나 같은 리듬을 만든다.
 */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  /** 오른쪽에 놓을 보조 요소 (더보기 링크 등) */
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span
        aria-hidden
        className="brand-gradient-y h-[18px] w-1 shrink-0 rounded-full"
      />
      <h2 className="text-lg font-extrabold tracking-tight">{children}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

/** 본문 아래 붙는 안내 문구 (* 로 시작하던 작은 글씨) */
export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-6 rounded-xl border border-border bg-surface-soft/70 px-4 py-3",
        "text-xs leading-relaxed text-muted [&_strong]:font-bold [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
