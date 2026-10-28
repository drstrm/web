import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import GuideDetail, { guideDetailMetadata } from "@/components/GuideDetail";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return guideDetailMetadata("streaming", slug, locale);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <GuideDetail page="streaming" slug={slug} />;
}
