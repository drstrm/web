import type { Metadata } from "next";
import FormLinks from "@/components/FormLinks";
import { Notice, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
import { FORM_PAGES, getFormLinks } from "@/lib/content";

/*
 * 폼 바로가기 (/forms)
 * 홈 바로가기 「폼 바로가기」 버튼이 여기로 온다. 목록은 노션 DB 에서 읽는다
 * (docs/notion-forms-db.md). 헬퍼 페이지(app/helper/page.tsx)와 같은 DB · 같은
 * 화면을 쓰고 `구분` 열로만 갈린다.
 */

const INFO = FORM_PAGES.form;

export const metadata: Metadata = { title: INFO.title };
export const revalidate = 300;

export default async function FormsPage() {
  const links = await getFormLinks(INFO.kind);

  return (
    <div>
      <PageHeader
        eyebrow="FORM"
        title={INFO.title}
        description={INFO.description}
        icon={iconForRoute("/forms")}
      />
      <FormLinks links={links} info={INFO} />
      <Notice>
        폼을 누르면 구글폼 등 외부 페이지가 새 탭으로 열립니다.
        <br />
        마감된 폼은 회색으로 남겨 두고, 새 폼이 열리면 목록 위쪽에 올라옵니다.
      </Notice>
    </div>
  );
}
