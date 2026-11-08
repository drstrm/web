import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TodoChecklist from "@/components/TodoChecklist";
import { PageHeader } from "@/components/ui";
import { getTodoList } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "todo" });
  return { title: t("title"), description: t("description") };
}

/**
 * /todo — 할일 전체 목록
 * ------------------------------------------------------------------
 * 홈 카드(components/TodoList.tsx)가 앞 몇 개만 보여주는 그 목록의 전체판이다.
 * 데이터는 홈과 똑같은 노션 조회(getTodoList)를 쓰고, 다른 점은 **체크박스**뿐이다
 * (components/TodoChecklist.tsx — 체크는 브라우저에 남는다).
 *
 * 홈과 같은 300초 재검증이다. 할일이 끝나는 순간은 마감 시각이라 홈보다 더
 * 촘촘히 볼 이유가 없고, 두 화면의 목록이 어긋나지 않는 편이 낫다.
 */
export const revalidate = 300;

export default async function TodoPage({ params }: Props) {
  const { locale } = await params;
  // 정적 렌더를 유지한다 — 빠지면 이 페이지가 요청마다 동적으로 돌아 ISR 이 죽는다
  setRequestLocale(locale);
  const t = await getTranslations("todo");

  const todos = await getTodoList();

  return (
    <div>
      <PageHeader
        eyebrow="TO DO"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/todo")}
      />

      <TodoChecklist todos={todos} />
    </div>
  );
}
