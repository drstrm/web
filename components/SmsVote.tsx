"use client";

import { MessageSquareText, Radio, Send } from "lucide-react";
import { useEffect, useState } from "react";
import SmartLink from "@/components/SmartLink";
import { Button, Card, IconTile, Notice } from "@/components/ui";
import { findSmsVoteSlot, type SmsVoteSlot } from "@/lib/oneclick";

/**
 * 문자 투표 원클릭
 * 현재 시간대(KST)의 음악방송을 표시하고, 해당 방송의 실시간 문자투표가
 * 열려 있을 때만(enabled) sms: 링크로 바로 전송창을 엽니다.
 *
 * 열려 있을 때만 포인트 컬러(샴페인) 버튼이 된다 — 색이 바뀌는 것 자체가
 * 「지금 보낼 수 있다」는 신호다.
 */
export default function SmsVote() {
  const [slot, setSlot] = useState<SmsVoteSlot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSlot(findSmsVoteSlot());
      setReady(true);
    };
    sync();
    const id = setInterval(sync, 30_000);
    return () => clearInterval(id);
  }, []);

  const active = Boolean(slot?.enabled && slot.number);
  const href = active
    ? `sms:${slot!.number}${slot!.keyword ? `&body=${encodeURIComponent(slot!.keyword)}` : ""}`
    : undefined;

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <IconTile tone="sky" size="md">
          <MessageSquareText strokeWidth={2.2} />
        </IconTile>
        <h3 className="font-extrabold">문자 투표 원클릭</h3>
      </div>

      <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
          <Radio className="size-3 shrink-0 text-sky-500" strokeWidth={2.4} />
          현재 시간대 음악방송
        </p>
        <p className="mt-1 flex items-center gap-2 text-lg font-extrabold text-sky-700">
          {active && (
            <span aria-hidden className="pulse-dot size-2 shrink-0 rounded-full bg-champagne-400" />
          )}
          <span className="min-w-0 truncate">
            {!ready ? "확인 중..." : (slot?.show ?? "방송 없음")}
          </span>
        </p>
      </div>

      {active ? (
        <Button asChild variant="accent" size="lg" block className="mt-4">
          <SmartLink href={href!}>
            <Send strokeWidth={2.4} />
            원클릭 문자투표
          </SmartLink>
        </Button>
      ) : (
        <Button variant="outline" size="lg" block disabled className="mt-4">
          <Send strokeWidth={2.4} />
          원클릭 문자투표
        </Button>
      )}

      <Notice className="mt-3">
        {active
          ? "모바일에서 문자 앱이 열립니다."
          : "실시간 문자투표 시간이 되면 버튼이 활성화됩니다."}
      </Notice>
    </Card>
  );
}
