import { CalendarRange } from "lucide-react";
import { Card, IconTile, SectionTitle } from "@/components/ui";
import {
  ALBUM,
  ALBUM_COMMON_BENEFITS,
  ALBUM_TABLE_VERSIONS,
  hasSetVersion,
} from "@/lib/album";

/**
 * 앨범 예약판매 상단 — 기간 · 버전 · 특전
 * ------------------------------------------------------------------
 * 값은 전부 lib/album.ts 에 있다(노션이 아니다 — 그 이유는 그 파일 주석).
 *
 * 기간만 강조한다. 「언제까지」는 지금 당장 움직여야 할 이유라 포인트색 타일을
 * 주지만, 버전 · 특전은 누르는 것도 고르는 것도 아닌 **읽고 넘기는 설명**이다.
 * 카드로 흩어 놓으면 실제로 눌러야 하는 아래쪽 앨범사 링크보다 먼저 눈에 들어와서,
 * 두 줄 표로 조용히 깔아 둔다 — 버전 수가 늘어도 높이가 조금씩만 자란다.
 */
export default function AlbumInfo() {
  return (
    <>
      {/* 기간 — 페이지에서 가장 먼저 읽혀야 하는 값이라 포인트색 타일을 준다 */}
      <Card className="flex items-center gap-3.5">
        <IconTile tone="accent" size="lg">
          <CalendarRange strokeWidth={2.2} />
        </IconTile>
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            예약판매 기간
          </p>
          <p className="text-xl font-extrabold tracking-tight">{ALBUM.period}</p>
        </div>
      </Card>

      <section>
        <SectionTitle>앨범 버전 · 특전</SectionTitle>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-soft text-[11px] font-bold tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5">
                  버전
                </th>
                <th scope="col" className="px-4 py-2.5">
                  추가 특전
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {ALBUM_TABLE_VERSIONS.map((v) => (
                <tr key={v.name}>
                  <th scope="row" className="px-4 py-3 text-left font-bold">
                    {v.name}
                    {/*
                     * 버전 이름 아래 붙는 단서 두 가지.
                     *  - 파는 곳이 정해진 버전 (Special Ver.)
                     *  - 멤버 개별 6종을 묶어 파는 세트가 따로 있는 버전
                     * 세트는 표에 줄을 따로 만들지 않는다 (lib/album.ts 의 setOf 주석)
                     */}
                    {(v.shops || hasSetVersion(v)) && (
                      <span className="mt-0.5 block text-xs font-semibold text-muted">
                        {[v.shops && `${v.shops.join(" · ")} 한정`, hasSetVersion(v) && "세트 구매 가능"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </th>
                  {/* 버전 이름보다 한 단계 작게 둔다 — 줄이 두 줄까지 늘어나는 칸이라
                      같은 크기로 두면 표에서 설명이 이름보다 무거워 보인다 */}
                  <td className="px-4 py-3 text-xs leading-relaxed text-muted">
                    {v.benefits ? (
                      <ul className="space-y-1">
                        {v.benefits.map((b) => (
                          /* 글머리표를 글자와 떼어 두면 줄이 넘어갈 때 둘째 줄이
                             점 아래가 아니라 글자 아래로 붙는다(행잉 인덴트) */
                          <li key={b} className="flex gap-1.5">
                            <span aria-hidden className="shrink-0 text-muted-soft">
                              •
                            </span>
                            <span className="min-w-0">{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /* 공통 특전만 받는 버전. 「없다」가 아니라 「추가가 없다」는 뜻이라
                         열 제목이 「추가 특전」이고, 공통은 표 바로 아래에 적어 둔다 */
                      <span className="text-muted-soft">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="border-t border-border bg-surface-soft/60 px-4 py-3 text-xs leading-relaxed text-muted">
            <strong className="font-bold text-foreground">전 버전 공통</strong>{" "}
            {ALBUM_COMMON_BENEFITS.join(" · ")}
          </p>
        </Card>
      </section>
    </>
  );
}
