"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SmartLink from "@/components/SmartLink";
import { iconForRoute } from "@/lib/nav-icons";
import { NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const close = () => setOpen(false);

  // 메뉴가 열린 동안 뒤 화면이 따라 스크롤되지 않게 잠근다
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border glass">
      {/* 브랜드 라인: 스카이 → 샴페인. 화면 맨 위를 가로지른다 */}
      <div aria-hidden className="brand-gradient h-[3px] w-full" />

      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        {/* 로고 → 메인으로 */}
        <SmartLink
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight"
        >
          {/*
           * 로고는 원본(400×400 · 197KB) 대신 128px 로 줄인 사본을 쓰고
           * `unoptimized` 로 /_next/image 최적화를 건너뛴다.
           * 32px 로 그려지는 이미지라 최적화로 줄어드는 양이 미미한 반면,
           * 개발 서버에서 첫 변환이 끝날 때까지 로고가 계속 빈칸으로 남는
           * 문제가 있었다. public 파일을 그대로 내보내면 그 대기가 없다.
           */}
          <Image
            src="/drstrm_logo.png"
            alt={SITE.shortName}
            width={32}
            height={32}
            priority
            unoptimized
            className="size-8 rounded-xl object-cover shadow-sm ring-1 ring-border"
          />
          <span className="font-display text-sm tracking-tight sm:text-base">
            {SITE.shortName}
          </span>
        </SmartLink>

        {/* 데스크톱 내비 */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="group relative">
                <SmartLink
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1 rounded-full px-3.5 py-2",
                    "font-display text-sm font-bold tracking-wide transition-colors",
                    active ? "text-sky-700" : "text-foreground hover:text-sky-600",
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      aria-hidden
                      className="size-3 text-muted-soft transition-transform group-hover:rotate-180"
                      strokeWidth={2.5}
                    />
                  )}
                  {/* 활성 표시는 샴페인 밑줄 — 파란 글씨와 겹치지 않고 눈에 띈다 */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-champagne-400"
                    />
                  )}
                </SmartLink>

                {item.children && (
                  <div className="invisible absolute left-0 top-full min-w-52 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
                      {item.children.map((c) => {
                        const Icon = iconForRoute(c.href);
                        const childActive = pathname === c.href;
                        return (
                          <SmartLink
                            key={c.href}
                            href={c.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                              childActive
                                ? "bg-sky-50 text-sky-700"
                                : "text-foreground hover:bg-sky-50 hover:text-sky-700",
                            )}
                          >
                            <Icon className="size-3.5 shrink-0 text-sky-500" strokeWidth={2.2} />
                            {c.label}
                          </SmartLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 모바일 토글 */}
        <button
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-sky-50 md:hidden"
        >
          {open ? (
            <X className="size-[18px]" strokeWidth={2.4} />
          ) : (
            <Menu className="size-[18px]" strokeWidth={2.4} />
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <nav
          id="mobile-nav"
          className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border bg-surface/95 backdrop-blur md:hidden"
        >
          <div className="mx-auto max-w-5xl space-y-1 px-4 py-3">
            {NAV.map((item) => {
              const Icon = iconForRoute(item.href);
              const active = isActive(item.href);
              return (
                <div key={item.href}>
                  <SmartLink
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors",
                      active ? "bg-sky-50 text-sky-700" : "hover:bg-sky-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg",
                        active
                          ? "champagne-gradient text-champagne-ink"
                          : "bg-sky-50 text-sky-600",
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="font-display tracking-wide">{item.label}</span>
                  </SmartLink>

                  {item.children && (
                    <div className="mb-1 ml-[26px] space-y-0.5 border-l border-border pl-4">
                      {item.children.map((c) => {
                        const ChildIcon = iconForRoute(c.href);
                        return (
                          <SmartLink
                            key={c.href}
                            href={c.href}
                            onClick={close}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              pathname === c.href
                                ? "font-bold text-sky-700"
                                : "text-muted hover:text-foreground",
                            )}
                          >
                            <ChildIcon className="size-3.5 shrink-0" strokeWidth={2} />
                            {c.label}
                          </SmartLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
