import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getStreamingGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("streaming");

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function StreamingGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/guide/streaming")}
      />
      <GuideList sections={await getStreamingGuides()} basePath={INFO.href} />
    </div>
  );
}
