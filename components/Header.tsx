"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, SITE } from "@/lib/site";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* 로고 → 메인으로 돌아가기 (기획안: 홈 상단 팀 로고) */}
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl sky-gradient text-white shadow-sm">
            ☁
          </span>
          <span className="text-sm sm:text-base">{SITE.shortName}</span>
        </Link>

        {/* 데스크톱 내비 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-sky-100 ${
                  isActive(item.href) ? "text-sky-600" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="invisible absolute left-0 top-full min-w-44 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="glass overflow-hidden rounded-2xl border shadow-lg">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="block px-4 py-2.5 text-sm hover:bg-sky-50"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 모바일 토글 */}
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-xl border md:hidden"
        >
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <nav className="border-t md:hidden">
          <div className="mx-auto max-w-5xl px-4 py-2">
            {NAV.map((item) => (
              <div key={item.href} className="py-1">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-bold ${
                    isActive(item.href) ? "bg-sky-100 text-sky-600" : ""
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-3 border-l pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
