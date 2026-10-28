"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { DARK_QUERY, THEME_COLOR, THEME_KEY, type Theme } from "@/lib/theme";

/**
 * 테마 토글 — 해 ↔ 달 좌우 스위치 (헤더 메뉴 왼쪽)
 * ------------------------------------------------------------------
 * 상태를 React 에 두지 않는다. 지금 테마는 html[data-theme] 과 시스템 설정에
 * 이미 적혀 있고, 손잡이 위치 · 아이콘 색 · 스크린리더 안내문도 globals.css 가
 * 그 두 가지로 골라 준다(.theme-thumb · .theme-switch-* · .theme-when-*). 덕분에
 *
 *   · 서버가 그린 HTML 과 첫 화면이 어긋나지 않아 손잡이가 튀지 않고
 *   · JS 가 붙기 전에도 지금 테마가 제대로 보인다.
 *
 * 누르면 반대 테마로 넘어가고, 그 반대가 마침 시스템 설정과 같으면 저장값을
 * 지워 「시스템 따라가기」로 되돌린다.
 *
 * ⚠ 크기(`w-16 p-[3px]` · `size-7`)는 globals.css 의 손잡이 이동거리
 * 1.75rem 과 맞물려 있다. 한쪽만 바꾸면 손잡이가 끝까지 가지 않는다.
 */
export default function ThemeToggle() {
  const tr = useTranslations("theme");
  const toggle = () => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(DARK_QUERY).matches;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : prefersDark;
    const next: Theme = isDark ? "light" : "dark";
    const followsSystem = (next === "dark") === prefersDark;

    if (followsSystem) {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = next;
    }

    try {
      if (followsSystem) localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // 시크릿 모드 등에서 저장이 막혀도 이번 방문은 바뀐 테마로 본다
    }

    syncThemeColor(followsSystem ? null : next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={tr("toggleTheme")}
      className="relative grid h-9 w-16 shrink-0 grid-cols-2 items-center rounded-full border border-border bg-surface-soft p-[3px] transition-colors hover:border-border-strong"
    >
      {/*
       * 미끄러지는 손잡이. 아이콘보다 뒤에 깔려서, 지금 켜진 쪽 아이콘만
       * 밝은 표면(bg-surface) 위에 올라와 보인다.
       */}
      <span
        aria-hidden
        className="theme-thumb absolute left-[3px] top-[3px] size-7 rounded-full bg-surface shadow-card transition-transform duration-200"
      />

      <span aria-hidden className="relative grid place-items-center">
        <Sun className="theme-switch-sun size-4" strokeWidth={2.4} />
      </span>
      <span aria-hidden className="relative grid place-items-center">
        <Moon className="theme-switch-moon size-4" strokeWidth={2.4} />
      </span>

      {/*
       * 버튼의 접근성 이름. CSS 가 지금 테마에 맞는 쪽만 남기므로 스크린리더는
       * 「지금 무엇이고 누르면 무엇이 되는지」를 한 문장으로 듣는다.
       * aria-label 을 달면 이 문장이 가려지니 달지 않는다.
       */}
      <span className="theme-when-light sr-only">
        {tr("lightHint")}
      </span>
      <span className="theme-when-dark sr-only">
        {tr("darkHint")}
      </span>
    </button>
  );
}

/**
 * 모바일 주소창 색을 맞춘다.
 *
 * layout.tsx 가 `media` 가 붙은 theme-color 메타 두 개를 심어 둔다. 시스템을
 * 따라갈 때는(explicit === null) 각자의 색으로 되돌리고, 테마를 고정했을 때는
 * 둘 다 같은 색으로 덮어 어느 쪽이 매치되든 고른 테마가 나오게 한다.
 */
function syncThemeColor(explicit: Theme | null) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const own = meta.media.includes("dark") ? "dark" : "light";
      meta.content = THEME_COLOR[explicit ?? own];
    });
}
