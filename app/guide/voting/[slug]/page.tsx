import type { Metadata } from "next";
import GuideDetail, { guideDetailMetadata } from "@/components/GuideDetail";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return guideDetailMetadata("voting", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <GuideDetail page="voting" slug={(await params).slug} />;
}
