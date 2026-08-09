import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getEtcGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("etc");

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function EtcGuidePage() {
  return (
    <div>
      <PageHeader eyebrow="GUIDE" title={INFO.title} description={INFO.description} />
      <GuideList sections={await getEtcGuides()} basePath={INFO.href} />
    </div>
  );
}
