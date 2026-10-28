import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import FormLinks from "@/components/FormLinks";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { FORM_PAGES, getFormLinks } from "@/lib/content";

/*
 * 헬퍼 신청하기 (/community/helper)
 * 홈 바로가기 「헬퍼 신청하기」 버튼이 여기로 온다. 폼 페이지(app/community/forms/page.tsx)와
 * 같은 노션 DB 를 `구분` 열로 나눠 쓴다 (docs/notion-forms-db.md).
 */

const INFO = FORM_PAGES.helper;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "form.helper" });
  return { title: t("title") };
}

export const revalidate = 300;

export default async function HelperPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("form.helper");
  const links = await getFormLinks(INFO.kind);

  return (
    <div>
      <PageHeader
        eyebrow="HELPER"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/community/helper")}
      />
      <FormLinks links={links} info={INFO} empty={t("empty")} />
    </div>
  );
}
