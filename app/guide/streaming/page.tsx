import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getStreamingGuides } from "@/lib/content";

export const metadata: Metadata = { title: "스트리밍 가이드" };
export const revalidate = 300;

export default function StreamingGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="스트리밍 가이드"
        description="플랫폼별 음원·MV 스트리밍 방법입니다. 이미지를 누르면 크게 보고 저장할 수 있어요."
      />
      <GuideList sections={getStreamingGuides()} />
    </div>
  );
}
