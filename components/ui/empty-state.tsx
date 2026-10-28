import { Construction, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 비어 있는 상태 안내.
 * 이모지 대신 lucide 아이콘을 원 안에 넣어, 어느 기기에서나 같은 크기로 그려진다.
 */
export function EmptyState({
  icon: Icon = Construction,
  title,
  description,
  tone = "sky",
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** accent 는 「곧 열린다」처럼 기대감을 주는 자리에 쓴다 */
  tone?: "sky" | "accent";
  action?: ReactNode;
  className?: string;
}) {
  const accent = tone === "accent";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center",
        accent ? "border-champagne-300 bg-champagne-50" : "border-border-strong bg-surface-soft/60",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          accent ? "champagne-gradient text-champagne-ink" : "bg-sky-100 text-sky-600",
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <p className={cn("mt-3 font-bold", accent && "text-champagne-800")}>{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * 「오픈 예정입니다」 — 가이드 · 폼 목록이 비었을 때.
 *
 * 문구에 기본값을 두지 않는다. 기본값을 두면 그 한국어가 어느 언어에서도
 * 그대로 나오고, 번역 추출 도구에도 안 잡힌다 — 호출하는 화면이 t() 로 넘긴다.
 */
export function ComingSoon({
  label,
  description,
  icon,
}: {
  label: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return <EmptyState icon={icon} title={label} description={description} tone="accent" />;
}
