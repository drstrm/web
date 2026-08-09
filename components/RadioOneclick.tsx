"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import RadioPossibility from "@/components/RadioPossibility";
import SmartLink from "@/components/SmartLink";
import {
  RADIO_DEFAULT_MESSAGE,
  RADIO_STATIONS,
  smsHref,
  type RadioNow,
  type RadioStation,
} from "@/lib/radio";

/**
 * 라디오 신청 원클릭
 * ------------------------------------------------------------------
 * 채널 버튼을 누르면 **지금 방송 중인 프로그램에 맞는 사연**을 팝업으로 보여준다.
 * 팝업 하단의 보내기 버튼을 누르면 문자 앱이 열리고 본문이 채워져 있다.
 * 사연은 /api/radio-message 가 만든다.
 *
 * 사연을 미리 받아 두는 이유: 보내기를 누른 뒤에 fetch 를 기다렸다가 sms: 로
 * 넘어가면, 기기가 "사용자 조작과 떨어진 이동"으로 보고 문자 앱을 안 열어준다.
 * 그래서 화면에 들어올 때 한 번, 1분마다 한 번, 그리고 한 번 보낸 뒤에 미리 받아
 * 둔다. 마지막 것은 같은 사연을 연달아 보내지 않게 하려는 목적도 있다.
 */
export default function RadioOneclick() {
  const [now, setNow] = useState<Record<string, RadioNow>>({});
  const [ready, setReady] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  /** 올릴 때마다 사연을 새로 받는다 (보낸 직후 · 새로고침 버튼) */
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/radio-message", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data: { stations: RadioNow[] } = await res.json();
        if (alive) {
          setNow(Object.fromEntries(data.stations.map((s) => [s.number, s])));
        }
      } catch {
        // 사연을 못 받아도 기본 문장으로 문자는 보낼 수 있다. 화면은 그대로 둔다.
      } finally {
        if (alive) setReady(true);
      }
    };

    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshKey]);

  const selectedStation =
    RADIO_STATIONS.find((station) => station.number === selectedNumber) ?? null;
  const selectedInfo = selectedNumber ? now[selectedNumber] : undefined;

  return (
    <div className="space-y-5">
      {groupStations().map(({ group, stations }) => (
        <div key={group}>
          <p className="mb-2 border-l-[3px] border-sky-300 pl-2 text-xs font-bold tracking-widest text-muted">
            {group}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {stations.map((station) => (
              <StationButton
                key={station.number}
                station={station}
                info={now[station.number]}
                ready={ready}
                onOpen={() => setSelectedNumber(station.number)}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedStation && (
        <MessageModal
          station={selectedStation}
          info={selectedInfo}
          ready={ready}
          onClose={() => setSelectedNumber(null)}
          onRefresh={refresh}
          onSend={refresh}
        />
      )}
    </div>
  );
}

function StationButton({
  station,
  info,
  ready,
  onOpen,
}: {
  station: RadioStation;
  info?: RadioNow;
  ready: boolean;
  onOpen: () => void;
}) {
  const onAir = info?.program
    ? info.djName
      ? `${info.program} · ${info.djName}`
      : info.program
    : "편성 없음";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-2xl border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex items-center gap-2">
        <span className="font-bold">{station.name}</span>
        {/* 확인 전에 뱃지를 띄우면 편성이 있는 채널도 "편성 정보 없음"으로 잠깐 보인다 */}
        {ready && (
          <span className="ml-auto">
            <RadioPossibility value={info?.possibility ?? null} />
          </span>
        )}
      </span>

      <span className="mt-0.5 block text-xs text-muted">
        {station.frequency} · {station.number}
      </span>

      <span className="mt-2 flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600">
        <span aria-hidden="true">📻</span>
        <span className="truncate">{ready ? onAir : "확인 중..."}</span>
      </span>
    </button>
  );
}

function MessageModal({
  station,
  info,
  ready,
  onClose,
  onRefresh,
  onSend,
}: {
  station: RadioStation;
  info?: RadioNow;
  ready: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSend: () => void;
}) {
  const message = info?.message ?? RADIO_DEFAULT_MESSAGE;
  const onAir = info?.program
    ? info.djName
      ? `${info.program} · ${info.djName}`
      : info.program
    : "편성 없음";

  /*
   * href 는 안드로이드 형태(`?body=`)로 두고, iOS 일 때만 눌리는 순간 `&body=`
   * 주소로 넘긴다. 기기 판별을 렌더 중에 하면 서버가 만든 href 와 달라져
   * 하이드레이션이 어긋난다 — 판별을 클릭 시점으로 미루면 그 문제가 없다.
   */
  const handleSend = (e: MouseEvent<HTMLAnchorElement>) => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      e.preventDefault();
      window.location.href = smsHref(station.number, message, true);
    }
    onSend();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <button
        type="button"
        aria-label="팝업 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="radio-message-title"
        className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
      >
        <header className="border-b p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-xl">
              📻
            </span>
            <div className="min-w-0 flex-1">
              <h3 id="radio-message-title" className="font-extrabold">
                {station.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted">
                {station.frequency} · {station.number}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-bold hover:bg-sky-50"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600">
            <span aria-hidden="true">ON AIR</span>
            <span className="min-w-0 truncate">{ready ? onAir : "확인 중..."}</span>
          </div>
        </header>

        <div className="overflow-y-auto p-4">
          <p className="rounded-2xl border bg-background p-4 text-sm leading-7 text-foreground">
            {ready ? message : "사연을 불러오는 중입니다."}
          </p>
        </div>

        <footer className="grid gap-2 border-t bg-surface p-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-sky-50"
          >
            사연 새로고침
          </button>
          <SmartLink
            href={smsHref(station.number, message, false)}
            onClick={handleSend}
            className="rounded-xl sky-gradient px-4 py-3 text-center text-sm font-bold text-white"
          >
            보내기
          </SmartLink>
        </footer>
      </section>
    </div>
  );
}

/** 방송사끼리 묶는다. 순서는 RADIO_STATIONS 에 적힌 그대로다 */
function groupStations(): { group: string; stations: RadioStation[] }[] {
  return RADIO_STATIONS.reduce<{ group: string; stations: RadioStation[] }[]>(
    (acc, station) => {
      const last = acc[acc.length - 1];
      if (last?.group === station.group) last.stations.push(station);
      else acc.push({ group: station.group, stations: [station] });
      return acc;
    },
    []
  );
}
