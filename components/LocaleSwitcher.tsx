"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/ui";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * 언어 스위치 (헤더 — 테마 토글 왼쪽)
 * ------------------------------------------------------------------
 * 고른 언어로 **같은 페이지**를 다시 연다. `usePathname()` 이 접두어를 뗀 경로를
 * 주므로(`/en/guide/streaming` → `/guide/streaming`), 어느 언어에서 눌러도
 * 보던 화면 그대로 언어만 갈린다 — 홈으로 튕기지 않는다.
 *
 * 고른 값은 next-intl 이 NEXT_LOCALE 쿠키에 남긴다. 그래서 다음 방문에는
 * 브라우저 설정 언어를 무시하고 고른 언어로 열린다 (proxy.ts 의 판단 순서).
 *
 * 메뉴 모양은 헤더 내비의 하위 메뉴와 같은 토큰을 쓴다(components/ui/dropdown.tsx).
 * 버튼에는 **언어 코드만** 둔다 — 모바일 헤더는 로고 · 언어 · 테마 · 햄버거가
 * 이미 들어차 있어서 「Bahasa Indonesia」 같은 긴 이름이 들어갈 자리가 없다.
 * 전체 이름은 펼친 메뉴에서 보여준다.
 */

/**
 * 언어 이름은 **그 언어로** 적는다. 영어를 못 읽는 사용자도 자기 언어를 찾을 수
 * 있어야 하고, 번역 대상도 아니다 (「한국어」는 어느 언어판에서도 「한국어」다).
 *
 * 계획된 6개를 미리 채워 둔다 — i18n/routing.ts 의 locales 에 코드를 더하면
 * 이 파일은 고칠 필요가 없다.
 */
const LOCALE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  id: "Bahasa Indonesia",
  th: "ไทย",
  ja: "日本語",
  zh: "中文",
};

export default function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const select = (next: string) => {
    if (next === locale) return;
    startTransition(() => {
      // pathname 은 접두어가 없는 경로다 — 보던 화면을 그대로 유지한다
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={`${t("label")}: ${LOCALE_LABELS[locale] ?? locale}`}
        className={cn(
          "group flex h-9 shrink-0 items-center gap-1 rounded-full border border-border",
          "bg-surface-soft pl-2.5 pr-2 outline-none transition-colors",
          "hover:border-border-strong focus-visible:ring-2 focus-visible:ring-sky-400",
          // 전환 중에는 흐려져서 「반응하고 있다」가 보인다 (느린 회선에서 특히)
          isPending && "opacity-60",
        )}
      >
        <Globe aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={2.4} />
        <span
          aria-hidden
          className="font-display text-xs font-bold uppercase tracking-wide"
        >
          {locale}
        </span>
        {/* 내비 메뉴와 같은 회전 — 열려 있음을 화살표로 알린다 */}
        <ChevronDown
          aria-hidden
          className="size-3 shrink-0 text-muted-soft transition-transform group-data-[state=open]:rotate-180"
          strokeWidth={2.5}
        />
      </DropdownTrigger>

      <DropdownContent>
        {routing.locales.map((code) => (
          <DropdownItem
            key={code}
            active={code === locale}
            onSelect={() => select(code)}
          >
            <span className="min-w-0 flex-1 truncate">
              {LOCALE_LABELS[code] ?? code.toUpperCase()}
            </span>
            {/* 지금 언어에만 체크 — 배경색만으로는 색각 이상에서 구분이 약하다 */}
            {code === locale && (
              <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={2.6} />
            )}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
