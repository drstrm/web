import type { ReactNode } from "react";
import SmartLink from "@/components/SmartLink";

/** 페이지 상단 타이틀 블록 */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sky-500">
          <span className="h-1.5 w-1.5 rounded-full accent-gradient" />
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>}
    </div>
  );
}

/** 오픈 예정 안내 (기획안 3: '오픈 예정입니다' 문구) */
export function ComingSoon({
  label = "오픈 예정입니다",
  description = "가이드가 준비되는 대로 업데이트됩니다.",
}: {
  label?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-champagne-deep/60 bg-champagne/15 px-6 py-10 text-center">
      <span className="text-3xl">🚧</span>
      <p className="mt-2 font-bold text-[#5a4a1f]">{label}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

/** 섹션 제목 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
      <span className="h-4 w-1.5 rounded-full sky-gradient" />
      {children}
    </h2>
  );
}

/** 콘텐츠 카드 */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** 링크형 큰 버튼. 내부 · 외부 판단은 SmartLink 가 한다 */
export function LinkButton({
  href,
  children,
  tone = "sky",
}: {
  href: string;
  children: ReactNode;
  tone?: "sky" | "champagne" | "ghost";
}) {
  const styles =
    tone === "sky"
      ? "sky-gradient text-white shadow-md"
      : tone === "champagne"
        ? "accent-gradient text-[#5a4a1f] shadow-md"
        : "border bg-surface hover:bg-sky-50";
  const cls = `inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-transform active:scale-[0.98] ${styles}`;

  return (
    <SmartLink href={href} className={cls}>
      {children}
    </SmartLink>
  );
}
