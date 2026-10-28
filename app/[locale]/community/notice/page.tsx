import { ArrowUpRight, Gift, Megaphone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SmartLink from "@/components/SmartLink";
import { Button, Card, IconTile, PageHeader } from "@/components/ui";
import { CONTACTS, NOTION } from "@/lib/site";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notice" });
  return { title: t("title") };
}

// A안: 콘텐츠는 Notion에서 관리 → ISR로 주기적 재검증
export const revalidate = 300;

export default async function NoticePage({ params }: Props) {
  const { locale } = await params;
  // 정적 렌더를 유지한다 — 빠지면 이 페이지가 요청마다 동적으로 돌아 ISR 이 죽는다
  setRequestLocale(locale);
  const t = await getTranslations("notice");
  // 문의 채널 라벨은 lib/site.ts 의 CONTACTS 가 루트 키를 들고 있다 (contact.*)
  const tRoot = await getTranslations();

  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/community/notice")}
      />

      <Card className="flex flex-col items-center p-8 text-center">
        <IconTile tone="sky" size="xl">
          <Megaphone strokeWidth={2.2} />
        </IconTile>
        <h2 className="mt-4 text-lg font-extrabold">{t("cardTitle")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("cardHint")}</p>
        <Button asChild variant="primary" size="lg" className="mt-5">
          <SmartLink href={NOTION.notice}>
            {t("open")}
            <ArrowUpRight strokeWidth={2.5} />
          </SmartLink>
        </Button>
      </Card>

      {/* 기프티콘 안내 공지: 스밍팀/이벤트팀 카카오채널 바로가기 */}
      <div className="mt-6 rounded-2xl border border-champagne-200 bg-champagne-50 p-5">
        <p className="flex items-center gap-2 font-bold text-champagne-800">
          <Gift className="size-4 shrink-0" strokeWidth={2.4} />
          {t("giftTitle")}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {t("giftHint")}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {CONTACTS.map((c) => (
            <Button key={c.href} asChild variant="accent" size="md">
              <SmartLink href={c.href}>
                <MessageCircle strokeWidth={2.5} />
                {tRoot(c.labelKey)}
              </SmartLink>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
