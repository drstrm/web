"use client";

import { useEffect, useState } from "react";
import { findSmsVoteSlot, type SmsVoteSlot } from "@/lib/oneclick";

/**
 * 문자 투표 원클릭
 * 현재 시간대(KST)의 음악방송을 표시하고, 해당 방송의 실시간 문자투표가
 * 열려 있을 때만(enabled) sms: 링크로 바로 전송창을 엽니다.
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
    <div className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl">✉️</span>
        <h3 className="font-extrabold">문자 투표 원클릭</h3>
      </div>

      <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3">
        <p className="text-xs font-bold text-muted">현재 시간대 음악방송</p>
        <p className="mt-0.5 text-lg font-extrabold text-sky-600">
          {!ready ? "확인 중..." : (slot?.show ?? "방송 없음")}
        </p>
      </div>

      {active ? (
        <a
          href={href}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl sky-gradient px-5 py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
        >
          📱 원클릭 문자투표
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border bg-background px-5 py-3.5 text-sm font-bold text-muted opacity-70"
        >
          📱 원클릭 문자투표
        </button>
      )}

      <p className="mt-2 text-[11px] text-muted">
        {active
          ? "* 모바일에서 문자 앱이 열립니다."
          : "* 실시간 문자투표 시간이 되면 버튼이 활성화됩니다."}
      </p>
    </div>
  );
}
