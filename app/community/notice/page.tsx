import { ArrowUpRight, Gift, Megaphone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";
import { Button, Card, IconTile, PageHeader } from "@/components/ui";
import { CONTACTS, NOTION } from "@/lib/site";
import { iconForRoute } from "@/lib/nav-icons";

export const metadata: Metadata = { title: "공지사항" };
// A안: 콘텐츠는 Notion에서 관리 → ISR로 주기적 재검증
export const revalidate = 300;

export default function NoticePage() {
  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title="공지사항"
        description="팀 공식 공지입니다. 내용은 운영진이 Notion에서 관리합니다."
        icon={iconForRoute("/community/notice")}
      />

      <Card className="flex flex-col items-center p-8 text-center">
        <IconTile tone="sky" size="xl">
          <Megaphone strokeWidth={2.2} />
        </IconTile>
        <h2 className="mt-4 text-lg font-extrabold">공식 공지 보기</h2>
        <p className="mt-1.5 text-sm text-muted">Notion 페이지로 이동합니다.</p>
        <Button asChild variant="primary" size="lg" className="mt-5">
          <SmartLink href={NOTION.notice}>
            공지사항 열기
            <ArrowUpRight strokeWidth={2.5} />
          </SmartLink>
        </Button>
      </Card>

      {/* 기프티콘 안내 공지: 스밍팀/이벤트팀 카카오채널 바로가기 */}
      <div className="mt-6 rounded-2xl border border-champagne-200 bg-champagne-50 p-5">
        <p className="flex items-center gap-2 font-bold text-champagne-800">
          <Gift className="size-4 shrink-0" strokeWidth={2.4} />
          기프티콘 이벤트 안내
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          기프티콘 관련 공지는 아래 카카오 채널에서 문의해 주세요.
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {CONTACTS.map((c) => (
            <Button key={c.label} asChild variant="accent" size="md">
              <SmartLink href={c.href}>
                <MessageCircle strokeWidth={2.5} />
                {c.label}
              </SmartLink>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
