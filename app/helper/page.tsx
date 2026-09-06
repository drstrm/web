import type { Metadata } from "next";
import FormLinks from "@/components/FormLinks";
import { Notice, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { FORM_PAGES, getFormLinks } from "@/lib/content";

/*
 * 헬퍼 신청하기 (/helper)
 * 홈 바로가기 「헬퍼 신청하기」 버튼이 여기로 온다. 폼 페이지(app/forms/page.tsx)와
 * 같은 노션 DB 를 `구분` 열로 나눠 쓴다 (docs/notion-forms-db.md).
 */

const INFO = FORM_PAGES.helper;

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function HelperPage() {
  const links = await getFormLinks(INFO.kind);

  return (
    <div>
      <PageHeader
        eyebrow="HELPER"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/helper")}
      />
      <FormLinks links={links} info={INFO} />
      <Notice>
        신청 폼을 누르면 구글폼 등 외부 페이지가 새 탭으로 열립니다.
        <br />
        모집이 끝난 폼은 회색으로 남겨 두고, 새 모집이 열리면 목록 위쪽에 올라옵니다.
      </Notice>
    </div>
  );
}
