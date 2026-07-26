import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getDownloadGuides } from "@/lib/content";

export const metadata: Metadata = { title: "다운로드 가이드" };
export const revalidate = 300;

export default function DownloadGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="다운로드 가이드"
        description="플랫폼별 음원·MV 다운로드 방법입니다."
      />
      <GuideList sections={getDownloadGuides()} />
    </div>
  );
}
