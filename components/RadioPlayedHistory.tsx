/*
 * 라디오 선곡 기록 — 신청곡(NCT DREAM 「Boogie Woogie」)이 언제 · 어느 채널 · 어느 프로그램에서 나왔나
 * ------------------------------------------------------------------
 * 수파베이스 `radio_played` 를 그대로 보여주는 서버 컴포넌트다. 줄을 넣는 쪽은
 * 수파베이스 엣지 펑션 radio-played(supabase/functions/radio-played) — pg_cron 이 2시간마다
 * 불러 방송사 공식 선곡표를 확인한다. 그래서 화면도 1시간 캐시면 충분하다 (실시간 조회를 하지 않는다).
 *
 * 로그처럼 최신순 표 한 장으로 쌓는다. 표는 높이를 묶어 두고 넘치면 안에서 스크롤한다 —
 * 기록이 늘어도 아래 편성표가 밀려 내려가지 않게. 아코디언 제목에 총 횟수를 띄우고, 처음엔 펼쳐 둔다.
 */

import { Music2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, IconTile, Notice } from "@/components/ui";
import { SEOUL_TZ } from "@/lib/datetime";
import { RADIO_STATIONS } from "@/lib/radio";
import { getRadioPlayedHistory, type RadioPlayedRow } from "@/lib/supabase";

/** 수집이 2시간 간격이라 그보다 짧게 잡을 이유가 없다 */
const HISTORY_REVALIDATE = 3600;
const ITEM = "played";

async function loadHistory(): Promise<RadioPlayedRow[] | null> {
  try {
    return await getRadioPlayedHistory(HISTORY_REVALIDATE);
  } catch (err) {
    // 환경변수 누락 · 테이블 없음 · 수파베이스 장애 — 페이지의 나머지는 그대로 보여준다
    console.error("[radio-played] 선곡 기록 조회 실패:", err);
    return null;
  }
}

export default async function RadioPlayedHistory() {
  const [rows, locale, tr] = await Promise.all([loadHistory(), getLocale(), getTranslations("radio")]);

  if (rows === null) return <Notice className="mt-0">{tr("historyError")}</Notice>;

  // 날짜는 로그답게 숫자로 고정하고(2026.11.10) 요일만 언어를 탄다.
  // KST 날짜를 그날 정오로 읽는다 — 자정으로 읽으면 시간대 변환에서 하루가 밀릴 수 있다
  const weekday = new Intl.DateTimeFormat(locale, { timeZone: SEOUL_TZ, weekday: "short" });
  const formatDate = (ymd: string) =>
    `${ymd.replaceAll("-", ".")} (${weekday.format(new Date(`${ymd}T12:00:00+09:00`))})`;
  const stationName = (number: string) => RADIO_STATIONS.find((s) => s.number === number)?.name ?? number;

  return (
    <Accordion type="single" collapsible defaultValue={ITEM}>
      <AccordionItem value={ITEM}>
        <AccordionTrigger>
          <IconTile tone="sky" size="lg">
            <Music2 strokeWidth={2.2} />
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-extrabold tracking-tight">Boogie Woogie</span>
            <span className="block truncate text-xs text-muted">{tr("historyLog")}</span>
          </span>
          <Badge variant={rows.length ? "accent-soft" : "muted"} size="lg">
            {tr("historyTotal", { count: rows.length })}
          </Badge>
        </AccordionTrigger>

        <AccordionContent>
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs font-semibold text-muted">{tr("historyEmpty")}</p>
          ) : (
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-surface-soft text-muted">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-4 py-2 font-bold">
                      {tr("historyColDate")}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2 py-2 font-bold">
                      {tr("historyColStation")}
                    </th>
                    <th scope="col" className="w-full px-4 py-2 font-bold">
                      {tr("historyColProgram")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={`${r.date}|${r.station}|${r.program}`} className="hover:bg-sky-50/60">
                      <td className="whitespace-nowrap px-4 py-2.5 font-display font-semibold tabular-nums text-sky-700">
                        {formatDate(r.date)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 font-semibold">{stationName(r.station)}</td>
                      <td className="px-4 py-2.5 text-muted">{r.program ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
