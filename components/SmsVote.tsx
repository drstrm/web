"use client";

import { MessageSquareText, Radio, Send } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import SmartLink from "@/components/SmartLink";
import { Button, Card, IconTile, Notice } from "@/components/ui";
import { findSmsVoteSlot, type SmsVoteSlot } from "@/lib/oneclick";
import { isIosDevice, smsHref } from "@/lib/sms";

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

  /** 지금 눌러서 보낼 수 있는 슬롯. 열려 있지 않거나 번호가 비면 null */
  const sendable = slot?.enabled && slot.number ? slot : null;
  const active = sendable !== null;

  /*
   * href 는 안드로이드 형태로 두고, iOS 일 때만 눌리는 순간 iOS 형태로 넘긴다.
   * 기기 판별을 렌더 중에 하면 하이드레이션이 어긋나므로 클릭 시점으로 미룬다.
   * 두 형태가 왜 다른지는 lib/sms.ts 의 smsHref 에 적어 뒀다.
   */
  const href = sendable ? smsHref(sendable.number, sendable.keyword, false) : undefined;

  const handleSend = (e: MouseEvent<HTMLAnchorElement>) => {
    if (sendable && isIosDevice()) {
      e.preventDefault();
      window.location.href = smsHref(sendable.number, sendable.keyword, true);
    }
  };

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
          <SmartLink href={href!} onClick={handleSend}>
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
