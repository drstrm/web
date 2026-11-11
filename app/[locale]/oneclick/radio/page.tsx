import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import RadioOneclick from "@/components/RadioOneclick";
import RadioPlayedHistory from "@/components/RadioPlayedHistory";
import RadioSchedule from "@/components/RadioSchedule";
import { PageHeader, SectionTitle } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

// 선곡 기록(RadioPlayedHistory)이 수파베이스를 1시간 캐시로 읽는다. 수집(엣지 펑션)이 2시간마다라 더 짧을 필요가 없다
export const revalidate = 3600;

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
        <SectionTitle>{t("playedTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-muted">{t("playedHint")}</p>
        <RadioPlayedHistory />
      </section>

      <section>
        <SectionTitle>{t("scheduleTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-muted">{t("scheduleHint")}</p>
        <RadioSchedule />
      </section>
    </div>
  );
}
