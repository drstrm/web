import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getIdGenerateGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("id-generate");

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function IdGenerateGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/guide/id-generate")}
      />
      <GuideList sections={await getIdGenerateGuides()} basePath={INFO.href} />
    </div>
  );
}
