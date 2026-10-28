import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getStreamingGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("streaming");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide.streaming" });
  return { title: t("title") };
}

export const revalidate = 300;

export default async function StreamingGuidePage({ params }: Props) {
  const { locale } = await params;
  // 정적 렌더 유지 — 빠지면 요청마다 동적으로 돌아 ISR 이 죽는다
  setRequestLocale(locale);
  const t = await getTranslations("guide.streaming");

  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/guide/streaming")}
      />
      <GuideList sections={await getStreamingGuides()} basePath={INFO.href} />
    </div>
  );
}
