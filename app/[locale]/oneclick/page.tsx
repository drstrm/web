import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HubCard, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oneclickHub" });
  return { title: t("title") };
}

/*
 * 허브 카드. 문구는 각 하위 페이지의 번역 키를 그대로 가리킨다 —
 * 한 군데만 고치면 메뉴 · 허브 · 페이지 헤더가 같이 바뀐다.
 */
const CATEGORIES: { href: string; titleKey: string; descKey: string }[] = [
  {
    href: "/oneclick/streaming",
    titleKey: "nav.streamingList",
    descKey: "oneclickHub.streamingDesc",
  },
  {
    href: "/oneclick/voting",
    titleKey: "nav.votingOneclick",
    descKey: "oneclickHub.votingDesc",
  },
  {
    href: "/oneclick/radio",
    titleKey: "nav.radio",
    descKey: "oneclickHub.radioDesc",
  },
];

export default async function OneclickIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <PageHeader
        eyebrow="ONECLICK"
        title={t("oneclickHub.title")}
        description={t("oneclickHub.description")}
        icon={iconForRoute("/oneclick")}
      />
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
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
