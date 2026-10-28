import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HubCard, PageHeader } from "@/components/ui";
import { GUIDE_PAGES } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guideHub" });
  return { title: t("navTitle") };
}

export default async function GuideIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={t("guideHub.title")}
        description={t("guideHub.description")}
        icon={iconForRoute("/guide")}
      />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {GUIDE_PAGES.map((c) => (
          <HubCard
            key={c.href}
            href={c.href}
            title={t(`guide.${c.page}.title`)}
            description={t(`guide.${c.page}.summary`)}
          />
        ))}
      </div>
    </div>
  );
}
