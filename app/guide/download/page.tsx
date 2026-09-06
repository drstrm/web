import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getDownloadGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("download");

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function DownloadGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/guide/download")}
      />
      <GuideList sections={await getDownloadGuides()} basePath={INFO.href} />
    </div>
  );
}
