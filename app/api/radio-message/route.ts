/*
 * 라디오 사연 문자 생성
 * ------------------------------------------------------------------
 * GET /api/radio-message
 *   → { stations: RadioNow[] }  (채널마다 지금 방송 + 지금 보낼 사연 한 통)
 *
 * 문장 풀(lib/radio-message.ts)이 2만 자가 넘어서 브라우저로 내리지 않고
 * 여기서 뽑아 문장 하나만 보낸다. 화면(components/RadioOneclick.tsx)은 이걸
 * 미리 받아 두었다가 버튼을 누르는 순간 바로 문자 앱에 채운다 — 누른 뒤에
 * 네트워크를 기다리면 기기가 문자 앱 전환을 취소해 버린다.
 *
 * 문장은 그날 풀(수파베이스 radio_messages, 매일 00시 예약 작업이 채운다)에서
 * 먼저 뽑고, 없거나 조회가 실패하면 코드에 있는 기본 풀로 돌아간다.
 */

import { kstNow, toSeoulDate } from "@/lib/datetime";
import { buildRadioMessage, toDailyPool, type DailyPool } from "@/lib/radio-message";
import { cornersOn, RADIO_PROGRAM_INFO } from "@/lib/radio-programs";
import { findRadioSlot, RADIO_STATIONS, type RadioNow } from "@/lib/radio";
import { getRadioMessages, getRadioPlayedStations } from "@/lib/supabase";

// 응답이 "지금 몇 시인가"에 달려 있다. 캐시되면 지난 프로그램 사연이 나간다.
// 그날 풀 조회만 캐시한다. 날짜가 주소에 들어가므로 자정이 지나면 저절로 새 조회가 된다.
// 짧게 잡은 이유: 00시 작업이 끝나기 전에 조회되면 「빈 결과」가 캐시되는데,
// 길면 그동안 기본 풀이 나간다.
export const dynamic = "force-dynamic";
const DAILY_REVALIDATE = 600;
// 선곡 기록은 나오자마자 버튼을 막아야 하니 짧게 둔다
const PLAYED_REVALIDATE = 60;

async function loadDailyPool(now: Date): Promise<DailyPool | null> {
  try {
    return toDailyPool(await getRadioMessages(toSeoulDate(now.toISOString()), DAILY_REVALIDATE));
  } catch (err) {
    // 환경변수 누락 · 테이블 없음 · 수파베이스 장애 — 사연은 기본 풀로 계속 나간다.
    console.error("[radio-message] 그날 문장 풀 조회 실패, 기본 풀 사용:", err);
    return null;
  }
}

async function loadPlayed(now: Date): Promise<Set<string>> {
  try {
    return new Set(await getRadioPlayedStations(toSeoulDate(now.toISOString()), PLAYED_REVALIDATE));
  } catch (err) {
    // 조회가 안 되면 「안 나옴」으로 둔다 — 막아야 할 버튼을 못 막는 쪽이 신청을 못 하게 되는 쪽보다 낫다
    console.error("[radio-message] 선곡 기록 조회 실패:", err);
    return new Set();
  }
}

export async function GET() {
  const now = new Date();
  const [daily, played] = await Promise.all([loadDailyPool(now), loadPlayed(now)]);
  const { day } = kstNow(now);

  const stations: RadioNow[] = RADIO_STATIONS.map((station) => {
    const slot = findRadioSlot(station.number, now);
    // 가능성 없는 편성에는 들으러 가기 · 홈페이지 · 코너를 띄우지 않는다
    const open = slot !== null && slot.possibility > 0;
    return {
      number: station.number,
      program: slot?.program ?? null,
      djName: slot?.djName ?? null,
      possibility: slot?.possibility ?? null,
      message: buildRadioMessage(slot, now, daily),
      liveUrl: open ? station.liveUrl : null,
      homepage: open ? (RADIO_PROGRAM_INFO[slot.program]?.homepage ?? null) : null,
      corners: open ? cornersOn(slot.program, day) : [],
      played: played.has(station.number),
    };
  });

  return Response.json(
    { stations },
    { headers: { "Cache-Control": "no-store" } }
  );
}
