import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AlbumInfo from "@/components/AlbumInfo";
import AlbumShops from "@/components/AlbumShops";
import GroupOrders from "@/components/GroupOrders";
import { Notice, PageHeader, SectionTitle } from "@/components/ui";
import { getAlbumBenefits, getAlbumShops, getGroupOrders } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

/*
 * 앨범 예약판매 (/community/album)
 * ------------------------------------------------------------------
 * 위에서 아래로 「언제까지 · 어떤 버전 · 무슨 특전」 → 「어디서 사나」 →
 * 「팬덤 공구」 순이다. 기간만 lib/album.ts 의 고정값이고, 버전 · 특전 표와
 * 판매 링크 두 종류는 노션 세 DB 에서 읽는다 (docs/notion-album-db.md).
 *
 * 노션 DB 를 아직 안 만들었어도 페이지는 정상으로 뜬다 — 링크 섹션만 「준비 중」이
 * 된다(lib/content.ts 가 조회 실패를 빈 배열로 흡수한다).
 */

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "album" });
  return { title: t("title") };
}

export const revalidate = 300;

export default async function AlbumPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("album");

  const [benefits, shops, groupOrders] = await Promise.all([
    getAlbumBenefits(),
    getAlbumShops(),
    getGroupOrders(),
  ]);

  return (
    /*
     * `break-keep` = word-break: keep-all. 한글은 기본값(normal)에서 글자 단위로
     * 끊기므로, 「포토카드」가 「포토카」/「드」로 갈라져 다음 줄로 넘어간다.
     * keep-all 을 주면 띄어쓰기 자리에서만 줄이 바뀌어 어절이 통째로 넘어간다 —
     * 좁은 화면에서 특전 문구를 읽을 때 차이가 가장 크게 난다.
     *
     * 이 페이지에만 거는 이유: 긴 영문 주소(앨범사 링크)가 통째로 넘칠 수 있는
     * 설정이라 사이트 전체에 깔지 않는다. 이 화면의 주소는 전부 `truncate` 로
     * 한 줄에 잘리므로 넘칠 자리가 없다.
     */
    <div className="break-keep">
      <PageHeader
        eyebrow="ALBUM"
        title={t("title")}
        description={t("description")}
        icon={iconForRoute("/community/album")}
      />

      <div className="space-y-10">
        <AlbumInfo benefits={benefits} />

        <section>
          <SectionTitle>{t("shopsTitle")}</SectionTitle>
          <AlbumShops shops={shops} />
        </section>

        <section>
          <SectionTitle>{t("groupOrdersTitle")}</SectionTitle>
          <GroupOrders orders={groupOrders} />
        </section>
      </div>

      {/*
       * 글머리표는 특전 표(components/AlbumInfo.tsx)와 같은 방식이다 — 점을 글자와
       * 떼어 둬서 줄이 넘어갈 때 둘째 줄이 글자 아래로 붙는다(행잉 인덴트).
       * `<br />` 로 줄만 나누던 것보다 세 가지 안내가 각각 하나로 읽힌다.
       */}
      <Notice>
        <ul className="space-y-1.5">
          <li className="flex gap-1.5">
            <span aria-hidden className="shrink-0">
              •
            </span>
            <span className="min-w-0">
              {t.rich("noticeBenefits", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
          <li className="flex gap-1.5">
            <span aria-hidden className="shrink-0">
              •
            </span>
            <span className="min-w-0">
              {t.rich("noticeGroupOrders", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
          <li className="flex gap-1.5">
            <span aria-hidden className="shrink-0">
              •
            </span>
            <span className="min-w-0">{t("noticeUpdate")}</span>
          </li>
        </ul>
      </Notice>
    </div>
  );
}
