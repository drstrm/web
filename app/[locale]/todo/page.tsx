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
 * (components/TodoChecklist.tsx — 체크는 브라우저에 남는다). 내려오는 것은 후보이고,
 * 보는 사람의 현지 「오늘」로 거르는 일은 브라우저가 한다 (lib/todo.ts).
 *
 * 홈과 같은 300초 재검증이다. 끝난 할일을 내리는 일은 브라우저가 1분마다 하므로
 * (lib/use-todo-clock.ts) 재검증은 노션에서 새로 적은 할일을 가져오는 주기일 뿐이다.
 */
export const revalidate = 300;

export default async function TodoPage({ params }: Props) {
  const { locale } = await params;
  // 정적 렌더를 유지한다 — 빠지면 이 페이지가 요청마다 동적으로 돌아 ISR 이 죽는다
  setRequestLocale(locale);
  const t = await getTranslations("todo");

  const { todos, renderedAt } = await getTodoList();

  return (
    <div>
      <PageHeader
        eyebrow="TO DO"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/todo")}
      />

      <TodoChecklist todos={todos} renderedAt={renderedAt} />
    </div>
  );
}
