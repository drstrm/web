import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StreamingLists from "@/components/StreamingLists";
import { Notice, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getStreamingLists } from "@/lib/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oneclickStreaming" });
  return { title: t("metaTitle") };
}

export const revalidate = 300;

export default async function OneclickStreamingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("oneclickStreaming");
  const tNav = await getTranslations("nav");
  const lists = await getStreamingLists();

  return (
    <div>
      <PageHeader
        eyebrow="ONECLICK"
        title={tNav("streamingList")}
        description={t("description")}
        icon={iconForRoute("/oneclick/streaming")}
      />
      <StreamingLists lists={lists} />
      <Notice>
        {/* 「본인 기기에 맞는 링크」만 굵게 — 번역문도 같은 자리에 <strong> 을 둔다 */}
        {t.rich("noticeDevice", {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
        <br />
        {t("noticeOrder")}
        <br />
        {t("noticeUpdate")}
      </Notice>
    </div>
  );
}
