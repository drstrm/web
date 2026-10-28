import { ArrowUpRight, CircleQuestionMark } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SmartLink from "@/components/SmartLink";
import { Badge, Button, Card, IconTile, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { NOTION } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return { title: t("metaTitle") };
}

export const revalidate = 300;

/** 뱃지로 보여줄 주제. 문구는 messages 의 `faq.topics.*` */
const TOPIC_KEYS = ["idDonation", "streaming", "event"] as const;

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/community/faq")}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TOPIC_KEYS.map((key) => (
          <Badge key={key} variant="outline" size="lg">
            {t(`topics.${key}`)}
          </Badge>
        ))}
      </div>

      <Card className="flex flex-col items-center p-8 text-center">
        <IconTile tone="sky" size="xl">
          <CircleQuestionMark strokeWidth={2.2} />
        </IconTile>
        <h2 className="mt-4 text-lg font-extrabold">{t("cardTitle")}</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
          {t("cardHint")}
        </p>
        <Button asChild variant="primary" size="lg" className="mt-5">
          <SmartLink href={NOTION.faq}>
            {t("open")}
            <ArrowUpRight strokeWidth={2.5} />
          </SmartLink>
        </Button>
      </Card>
    </div>
  );
}
