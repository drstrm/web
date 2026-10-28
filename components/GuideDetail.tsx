import { ArrowLeft, ChevronLeft, FileImage, ImageDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoadingImage from "@/components/LoadingImage";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, Button, EmptyState, IconTile } from "@/components/ui";
import { getGuideEntry, getGuidePageInfo, type GuidePage } from "@/lib/content";

/**
 * 가이드 상세 (플랫폼 하나)
 * ------------------------------------------------------------------
 * 목록에서 고른 가이드 이미지를 화면 폭에 꽉 차게 세로로 이어 붙인다.
 * 모바일에서는 좌우 여백(main 의 px-4)까지 지워 정말 끝까지 채우고,
 * 데스크톱에서는 본문 폭(max-w-5xl) 안에서 카드처럼 보이게 둔다.
 *
 * 이미지 원본 크기는 노션이 알려주지 않으므로 width/height 는 세로형 기본값이다.
 * `h-auto w-full` 이 실제 비율을 따라가므로 표시에는 영향이 없다(로딩 전 자리 예약용).
 */
export default async function GuideDetail({
  page,
  slug,
}: {
  page: GuidePage;
  slug: string;
}) {
  const entry = await getGuideEntry(page, decodeSlug(slug));
  if (!entry) notFound();

  const { item, section } = entry;
  const info = getGuidePageInfo(page);
  const images = item.images ?? [];
  const t = await getTranslations("guideDetail");
  // 카테고리 이름(「스트리밍 가이드」)은 가이드 묶음에 있다
  const category = await getTranslations(`guide.${page}`);

  return (
    <div>
      <SmartLink
        href={info.href}
        className="inline-flex items-center gap-1 text-sm font-bold text-muted transition-colors hover:text-sky-700"
      >
        <ChevronLeft className="size-3.5 shrink-0" strokeWidth={2.5} />
        {category("title")}
      </SmartLink>

      <header className="mt-3 mb-6 flex items-start gap-3">
        {item.iconTypes && item.iconTypes.length > 0 && (
          <div className="flex shrink-0 gap-1.5">
            {item.iconTypes.map((key) => (
              <IconTile key={key} tone="sky" size="lg">
                <PlatformIcon iconType={key} size={48} />
              </IconTile>
            ))}
          </div>
        )}
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2">
            <span className="champagne-glow inline-block size-1.5 rounded-full bg-champagne-400" />
            <span className="text-brand-gradient font-display text-xs font-bold uppercase tracking-[0.18em]">
              {section.title}
            </span>
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {item.title}
          </h1>
          {item.summary && (
            <p className="mt-1.5 text-sm text-muted">{item.summary}</p>
          )}
        </div>
      </header>

      {images.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title={t("noImages")}
          description={t("noImagesHint")}
        />
      ) : (
        <div className="-mx-4 space-y-6 sm:mx-0">
          {images.map((img, i) => (
            <figure key={img.src}>
              <LoadingImage
                src={img.src}
                alt={img.alt}
                width={1200}
                height={1600}
                sizes="(max-width: 1024px) 100vw, 1024px"
                // 첫 장은 화면에 바로 보이므로 지연 없이 받는다.
                priority={i === 0}
                wrapperClassName="bg-sky-50 sm:rounded-2xl sm:border"
                className="block h-auto w-full"
              />
              <figcaption className="mt-2.5 flex items-center justify-between gap-2 px-4 sm:px-0">
                {images.length > 1 ? (
                  <Badge variant="muted" size="md">
                    {i + 1} / {images.length}
                  </Badge>
                ) : (
                  <span />
                )}
                {/* 이동이 아니라 파일 저장이라 SmartLink 를 쓰지 않는다 */}
                <Button asChild variant="accent" size="sm">
                  <a href={img.src} download>
                    <ImageDown strokeWidth={2.4} />
                    {t("saveImage")}
                  </a>
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Button asChild variant="outline" size="lg">
          <SmartLink href={info.href}>
            <ArrowLeft strokeWidth={2.4} />
            {t("backToList", { category: category("title") })}
          </SmartLink>
        </Button>
      </div>
    </div>
  );
}

/**
 * 상세 페이지의 <title>. 항목을 못 찾으면(=404) 카테고리 이름으로 둔다.
 * 각 라우트의 generateMetadata 가 이 함수만 호출하면 되도록 여기 둔다.
 */
export async function guideDetailMetadata(
  page: GuidePage,
  slug: string,
  locale: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `guide.${page}` });
  const category = t("title");
  const entry = await getGuideEntry(page, decodeSlug(slug));
  if (!entry) return { title: category };

  /*
   * 노션 제목이 이미 "멜론 다운로드 가이드" 처럼 카테고리를 품고 있으면
   * 덧붙이지 않는다. 노션 제목은 운영진이 쓴 한국어라 카테고리명이 번역된
   * 언어에서는 이 비교가 걸리지 않고 둘 다 붙는데, 그래도 틀린 제목은 아니다.
   */
  const { title } = entry.item;
  return { title: title.includes(category) ? title : `${title} · ${category}` };
}

/**
 * 슬러그에는 한글이 들어가므로 주소창·복사된 링크에서는 퍼센트 인코딩된 형태로 온다.
 * 슬러그 생성 규칙상 `%` 는 남지 않으니, 이미 디코딩된 값을 넣어도 결과는 같다.
 */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
