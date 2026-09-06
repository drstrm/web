import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getVotingGuides, getGuidePageInfo } from "@/lib/content";

const INFO = getGuidePageInfo("voting");

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function VotingGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/guide/voting")}
      />
      <GuideList sections={await getVotingGuides()} basePath={INFO.href} />
    </div>
  );
}
