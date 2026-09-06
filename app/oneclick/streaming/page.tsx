import type { Metadata } from "next";
import StreamingLists from "@/components/StreamingLists";
import { Notice, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { getStreamingLists } from "@/lib/content";

export const metadata: Metadata = { title: "스밍리스트 원클릭" };
export const revalidate = 300;

export default async function OneclickStreamingPage() {
  const lists = await getStreamingLists();

  return (
    <div>
      <PageHeader
        eyebrow="ONECLICK"
        title="스밍리스트"
        description="플랫폼과 사용 중인 기기를 고르면 원클릭 스밍 링크가 바로 열립니다."
        icon={iconForRoute("/oneclick/streaming")}
      />
      <StreamingLists lists={lists} />
      <Notice>
        원클릭 링크는 플랫폼 · 기기(안드로이드 / iOS / PC)마다 다릅니다.{" "}
        <strong>본인 기기에 맞는 링크</strong>를 눌러주세요.
        <br />
        리스트가 여러 개인 경우 1~4번을 순서대로 돌려주시면 됩니다.
        <br />
        링크는 컴백 시 최신 음원 기준으로 업데이트됩니다.
      </Notice>
    </div>
  );
}
