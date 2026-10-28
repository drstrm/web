import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import RadioOneclick from "@/components/RadioOneclick";
import RadioSchedule from "@/components/RadioSchedule";
import { PageHeader, SectionTitle } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oneclickRadio" });
  return { title: t("metaTitle") };
}

export default async function OneclickRadioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("oneclickRadio");
  const tRadio = await getTranslations("radio");
  const tNav = await getTranslations("nav");

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ONECLICK"
        title={tNav("radio")}
        description={t("description")}
        icon={iconForRoute("/oneclick/radio")}
      />

      <section>
        <SectionTitle>{t("oneclickTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-muted">
          {t("oneclickHint")} {tRadio("editNotice")}.
        </p>
        <RadioOneclick />
      </section>

      <section>
        <SectionTitle>{t("scheduleTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-muted">{t("scheduleHint")}</p>
        <RadioSchedule />
      </section>
    </div>
  );
}
