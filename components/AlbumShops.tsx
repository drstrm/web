"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  ComingSoon,
  IconTile,
} from "@/components/ui";
import type { AlbumShop } from "@/lib/content";

/**
 * 앨범사 예약판매 링크 (판매처 > 버전)
 * ------------------------------------------------------------------
 * 목록 · 순서는 노션 가로형 표에서 온다 (docs/notion-album-db.md).
 *
 * 판매처를 접어 두는 이유: 앨범사가 10곳을 넘고 각 앨범사가 버전 버튼을 최대 8개
 * 가진다. 전부 펼치면 버튼 100개가 한 화면에 깔려서, 「어느 앨범사에서 살지」를
 * 고르는 첫 단계가 묻힌다. 접어 두면 앨범사 목록을 먼저 훑고 고른 곳만 펼친다
 * (스밍리스트 원클릭과 같은 구조 — components/StreamingLists.tsx).
 *
 * 접힌 줄에는 판매처 이름만 둔다. 파는 버전을 한 줄로 늘어놓아 봤지만, 거의 모든
 * 앨범사가 같은 8칸을 파는 탓에 모든 줄에 같은 문장이 반복되면서 판매처 이름을
 * 가리기만 했다. 첫 번째 판매처는 펼쳐 둬서 「펼치면 버전이 나온다」가 바로 보인다.
 */
export default function AlbumShops({ shops }: { shops: AlbumShop[] }) {
  const t = useTranslations("albumShops");
  // 노션 조회에 실패했거나(로그: [album-shops]) 아직 DB · 행이 없는 경우
  if (shops.length === 0) {
    return (
      <ComingSoon
        label={t("empty")}
        description={t("emptyHint")}
        icon={Store}
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={shops[0].name}
      className="space-y-3"
    >
      {shops.map((shop) => (
        <AccordionItem key={shop.name} value={shop.name}>
          <AccordionTrigger>
            {/*
             * 쇼핑몰 로고. 로고를 못 구한 판매처는 기본 상점 그림으로 떨어진다
             * (어떤 판매처에 로고가 있는지는 lib/album.ts 의 ALBUM_SHOP_ICONS).
             * 앱 아이콘이라 그림 안에 이미 여백이 있어서 타일을 꽉 채운다.
             */}
            <IconTile tone="sky" size="lg">
              <PlatformIcon
                iconType={shop.iconType}
                label={shop.name}
                size={48}
                fallback={<Store strokeWidth={2.2} />}
              />
            </IconTile>
            <span className="min-w-0 truncate font-bold">{shop.name}</span>
          </AccordionTrigger>

          <AccordionContent className="p-4">
            {/* 버전 이름이 길어서 좁은 화면도 2열까지만 둔다 (넘치면 버튼 안에서 줄임) */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {shop.links.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="soft"
                  size="md"
                  className="px-2.5 text-xs"
                >
                  <SmartLink href={link.href}>
                    <span className="min-w-0 truncate">{link.version}</span>
                  </SmartLink>
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
