import { CalendarRange } from "lucide-react";
import { Card, ComingSoon, IconTile, SectionTitle } from "@/components/ui";
import { ALBUM } from "@/lib/album";
import type { AlbumBenefit } from "@/lib/content";

/**
 * 앨범 예약판매 상단 — 기간 · 버전 · 특전
 * ------------------------------------------------------------------
 * 기간은 lib/album.ts 의 고정값이고, 버전 · 특전 표는 노션에서 온다
 * (docs/notion-album-db.md 의 「버전별 특전 정리」 DB).
 *
 * 기간만 강조한다. 「언제까지」는 지금 당장 움직여야 할 이유라 포인트색 타일을
 * 주지만, 버전 · 특전은 누르는 것도 고르는 것도 아닌 **읽고 넘기는 설명**이다.
 * 카드로 흩어 놓으면 실제로 눌러야 하는 아래쪽 앨범사 링크보다 먼저 눈에 들어와서,
 * 두 줄 표로 조용히 깔아 둔다 — 줄이 늘어도 높이가 조금씩만 자란다.
 *
 * 「전 버전 공통」처럼 버전이 아닌 줄도 노션에 적힌 그대로 한 줄이 된다. 어느 줄을
 * 특별 취급하는 규칙을 코드에 두지 않아야, 줄을 더하고 옮기는 일이 노션에서 끝난다.
 */
export default function AlbumInfo({ benefits }: { benefits: AlbumBenefit[] }) {
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
        {/* 노션 조회에 실패했거나(로그: [album-benefits]) 아직 행이 없는 경우 */}
        {benefits.length === 0 ? (
          <ComingSoon
            label="버전 · 특전 정리 중입니다"
            description="앨범사 공지가 나오는 대로 버전별 특전을 올려드릴게요."
          />
        ) : (
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
                {benefits.map((row) => (
                  <tr key={row.key}>
                    <th scope="row" className="px-4 py-3 text-left font-bold">
                      {row.version}
                      {/* 노션 `비고` — 「세트 구매 가능」 · 「SMTOWN &STORE · Berriz 한정」 */}
                      {row.note && (
                        <span className="mt-0.5 block text-xs font-semibold text-muted">
                          {row.note}
                        </span>
                      )}
                    </th>
                    {/* 버전 이름보다 한 단계 작게 둔다 — 줄이 두 줄까지 늘어나는 칸이라
                        같은 크기로 두면 표에서 설명이 이름보다 무거워 보인다 */}
                    <td className="px-4 py-3 text-xs leading-relaxed text-muted">
                      {row.benefits.length > 0 ? (
                        <ul className="space-y-1">
                          {row.benefits.map((item) => (
                            /* 글머리표를 글자와 떼어 두면 줄이 넘어갈 때 둘째 줄이
                               점 아래가 아니라 글자 아래로 붙는다(행잉 인덴트) */
                            <li key={item} className="flex gap-1.5">
                              <span aria-hidden className="shrink-0 text-muted-soft">
                                •
                              </span>
                              <span className="min-w-0">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        /* 공통 특전만 받는 버전. 「없다」가 아니라 「추가가 없다」는 뜻이라
                           열 제목이 「추가 특전」이다 */
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </>
  );
}
