import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { CONTACTS, NOTION } from "@/lib/site";

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
      />

      <div className="rounded-2xl border bg-surface p-6 text-center shadow-sm">
        <span className="text-4xl">📢</span>
        <h2 className="mt-3 text-lg font-extrabold">공식 공지 보기</h2>
        <p className="mt-1 text-sm text-muted">
          Notion으로 관리되는 최신 공지를 확인하세요.
        </p>
        <a
          href={NOTION.notice}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl sky-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md"
        >
          공지사항 열기 ↗
        </a>
      </div>

      {/* 기프티콘 안내 공지: 스밍팀/이벤트팀 카카오채널 바로가기 */}
      <div className="mt-6 rounded-2xl border border-dashed bg-champagne/20 p-5">
        <p className="text-sm font-bold">🎁 기프티콘 이벤트 안내</p>
        <p className="mt-1 text-xs text-muted">
          기프티콘 관련 공지는 아래 카카오 채널에서 문의해 주세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full accent-gradient px-4 py-2 text-xs font-bold text-[#5a4a1f]"
            >
              💬 {c.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
