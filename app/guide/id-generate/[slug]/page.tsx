import type { Metadata } from "next";
import GuideDetail, { guideDetailMetadata } from "@/components/GuideDetail";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return guideDetailMetadata("id-generate", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <GuideDetail page="id-generate" slug={(await params).slug} />;
}
