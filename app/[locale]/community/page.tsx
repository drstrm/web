import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HubCard, PageHeader } from "@/components/ui";
import { FORM_PAGES } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return { title: t("title") };
}

/*
 * 커뮤니티 허브의 카드 목록.
 *
 * 문구는 각 페이지와 어긋나지 않게 **그 페이지의 번역 키를 그대로 가리킨다** —
 * 폼 · 헬퍼 카드가 `form.form.*` 을 쓰는 이유다. 한 군데만 고치면 메뉴 · 허브 ·
 * 페이지 헤더가 같이 바뀐다.
 */
const CATEGORIES: { href: string; titleKey: string; descKey: string }[] = [
  {
    href: "/community/notice",
    titleKey: "notice.title",
    descKey: "community.noticeDesc",
  },
  {
    href: "/community/faq",
    titleKey: "faq.title",
    descKey: "community.faqDesc",
  },
  {
    href: FORM_PAGES.form.href,
    titleKey: "form.form.title",
    descKey: "form.form.description",
  },
  {
    href: FORM_PAGES.helper.href,
    titleKey: "form.helper.title",
    descKey: "form.helper.description",
  },
  // 컴백 때만 쓰는 카드. 예약판매가 끝나면 이 항목과 NAV 의 같은 줄을 지운다
  {
    href: "/community/album",
    titleKey: "album.title",
    descKey: "album.description",
  },
];

export default async function CommunityIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // 카드 문구가 여러 묶음에 흩어져 있어 루트에서 꺼낸다
  const t = await getTranslations();

  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title={t("community.title")}
        description={t("community.description")}
        icon={iconForRoute("/community")}
      />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {CATEGORIES.map((c) => (
          <HubCard
            key={c.href}
            href={c.href}
            title={t(c.titleKey)}
            description={t(c.descKey)}
          />
        ))}
      </div>
    </div>
  );
}
