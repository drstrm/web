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
 */

import { buildRadioMessage } from "@/lib/radio-message";
import { findRadioSlot, RADIO_STATIONS, type RadioNow } from "@/lib/radio";

// 응답이 "지금 몇 시인가"에 달려 있다. 캐시되면 지난 프로그램 사연이 나간다.
export const dynamic = "force-dynamic";

export function GET() {
  const now = new Date();

  const stations: RadioNow[] = RADIO_STATIONS.map((station) => {
    const slot = findRadioSlot(station.number, now);
    return {
      number: station.number,
      program: slot?.program ?? null,
      djName: slot?.djName ?? null,
      possibility: slot?.possibility ?? null,
      message: buildRadioMessage(slot, now),
    };
  });

  return Response.json(
    { stations },
    { headers: { "Cache-Control": "no-store" } }
  );
}
