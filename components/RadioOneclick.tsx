"use client";

import { Pencil, Radio, RefreshCw, SendHorizontal } from "lucide-react";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import RadioPossibility from "@/components/RadioPossibility";
import SmartLink from "@/components/SmartLink";
import {
  Button,
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
  IconTile,
} from "@/components/ui";
import {
  RADIO_DEFAULT_MESSAGE,
  RADIO_MESSAGE_NOTICE,
  RADIO_STATIONS,
  type RadioNow,
  type RadioStation,
} from "@/lib/radio";
import { isIosDevice, smsHref } from "@/lib/sms";

/**
 * 라디오 신청 원클릭
 * ------------------------------------------------------------------
 * 채널 버튼을 누르면 **지금 방송 중인 프로그램에 맞는 사연**을 팝업으로 보여준다.
 * 사연은 팝업 안에서 고쳐 쓸 수 있고, 보내기 버튼을 누르면 문자 앱이 열리며
 * **화면에 보이는 그대로** 본문에 채워진다. 자동 생성은 /api/radio-message 가 한다.
 *
 * 사연은 **채널을 누를 때마다** 새로 받는다. 서버가 요청마다 문장을 무작위로 뽑고
 * 응답을 캐시하지 않으므로(/api/radio-message), 같은 채널을 다시 눌러도 · 다른
 * 사람이 같은 시각에 눌러도 서로 다른 사연이 나온다.
 *
 * 미리 받아 두는 이유: 보내기를 누른 뒤에 fetch 를 기다렸다가 sms: 로 넘어가면,
 * 기기가 "사용자 조작과 떨어진 이동"으로 보고 문자 앱을 안 열어준다. 채널을 누르는
 * 것과 보내기를 누르는 것은 서로 다른 클릭이라, 팝업을 여는 시점에 받아 두면 보내기
 * 클릭에서는 기다릴 것이 없다.
 *
 * 첫 진입에도 한 번 받는데, 그건 사연 때문이 아니라 버튼에 지금 방송 중인 프로그램을
 * 띄우기 위한 것이다.
 *
 * 팝업은 Radix Dialog 라 포커스 가둠 · Esc 닫기 · 배경 스크롤 잠금이 따라온다.
 */
export default function RadioOneclick() {
  const [now, setNow] = useState<Record<string, RadioNow>>({});
  /** 첫 조회 완료 여부. 버튼의 편성 · 가능성 뱃지를 언제 띄울지 정한다 */
  const [ready, setReady] = useState(false);
  /** 사연을 새로 받아오는 중 (팝업이 「불러오는 중」을 띄운다) */
  const [loading, setLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  /** 올릴 때마다 사연을 새로 받는다 (채널을 누를 때 · 새로 받기 · 보낸 직후) */
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // 이 조회가 끝나기 전에 다음 조회가 시작되면(연달아 누르기) 이쪽 응답은 버린다
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
        // 못 받아도 앞서 받아 둔 문장이나 기본 문장으로 문자는 보낼 수 있다.
      } finally {
        if (alive) {
          setReady(true);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const openStation = (number: string) => {
    setSelectedNumber(number);
    // 누를 때마다 새 사연을 받는다 (같은 채널을 다시 눌러도 문장이 달라진다)
    reload();
  };

  const selectedStation =
    RADIO_STATIONS.find((station) => station.number === selectedNumber) ?? null;
  const selectedInfo = selectedNumber ? now[selectedNumber] : undefined;

  return (
    <div className="space-y-6">
      {groupStations().map(({ group, stations }) => (
        <div key={group}>
          <p className="mb-2.5 flex items-center gap-2">
            <span aria-hidden className="brand-gradient-y h-3.5 w-1 shrink-0 rounded-full" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {group}
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {stations.map((station) => (
              <StationButton
                key={station.number}
                station={station}
                info={now[station.number]}
                ready={ready}
                onOpen={() => openStation(station.number)}
              />
            ))}
          </div>
        </div>
      ))}

      <Dialog
        open={selectedStation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNumber(null);
        }}
      >
        {selectedStation && (
          <MessageModal
            /* 채널이 바뀌면 고쳐 쓰던 사연이 따라가지 않도록 새로 만든다 */
            key={selectedStation.number}
            station={selectedStation}
            info={selectedInfo}
            loading={loading}
            onRefresh={reload}
            onSend={reload}
          />
        )}
      </Dialog>
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
      className="block w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift active:scale-[0.99]"
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

      <span className="mt-1 block font-display text-xs font-semibold text-muted">
        {station.frequency} · {station.number}
      </span>

      <span className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">
        <Radio className="size-3 shrink-0" strokeWidth={2.4} />
        <span className="truncate">{ready ? onAir : "확인 중..."}</span>
      </span>
    </button>
  );
}

function MessageModal({
  station,
  info,
  loading,
  onRefresh,
  onSend,
}: {
  station: RadioStation;
  info?: RadioNow;
  loading: boolean;
  onRefresh: () => void;
  onSend: () => void;
}) {
  const generated = info?.message ?? RADIO_DEFAULT_MESSAGE;

  /*
   * 사용자가 고쳐 쓴 사연. null 은 「아직 손대지 않았다」는 뜻이라 자동 생성 문장을
   * 그대로 따라간다.
   *
   * 이 구분이 필요한 이유: 보낸 뒤에도 사연을 새로 받아 오는데(onSend), 그때 화면
   * 값을 덮어쓰면 공들여 고쳐 쓴 글이 날아간다. 한 글자라도 고친 뒤에는 새 사연이
   * 와도 화면을 건드리지 않고, 「사연 새로 받기」를 눌렀을 때만 되돌아간다.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const message = draft ?? generated;

  const onAir = info?.program
    ? info.djName
      ? `${info.program} · ${info.djName}`
      : info.program
    : "편성 없음";

  /*
   * 새 사연을 받는 동안에는 이전 문장을 보여주지 않는다 — 팝업을 열자마자 읽던
   * 문장이 다른 것으로 뒤바뀌는 것처럼 보이기 때문이다.
   * 고쳐 쓴 글이 있으면(draft) 그건 갱신 대상이 아니라 그대로 둔다.
   */
  const pending = loading && draft === null;

  // 비운 채로는 보낼 수 없다 (본문 없는 문자가 열릴 뿐이다)
  const canSend = !pending && message.trim().length > 0;

  const handleRefresh = () => {
    setDraft(null);
    onRefresh();
  };

  /*
   * href 는 안드로이드 형태(`sms:%23번호?body=`)로 두고, iOS 일 때만 눌리는 순간
   * iOS 형태(`sms:#번호&body=`)로 넘긴다. 기기 판별을 렌더 중에 하면 서버가 만든
   * href 와 달라져 하이드레이션이 어긋난다 — 판별을 클릭 시점으로 미루면 그 문제가
   * 없다. 두 형태가 왜 다른지는 lib/radio.ts 의 smsHref 에 적어 뒀다.
   */
  const handleSend = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isIosDevice()) {
      e.preventDefault();
      window.location.href = smsHref(station.number, message, true);
    }
    onSend();
  };

  return (
    <DialogContent aria-describedby={undefined}>
      <header className="border-b border-border p-4">
        <div className="flex items-start gap-3">
          <IconTile tone="sky" size="lg">
            <Radio strokeWidth={2.2} />
          </IconTile>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-extrabold">{station.name}</DialogTitle>
            <p className="mt-0.5 truncate font-display text-xs font-semibold text-muted">
              {station.frequency} · {station.number}
            </p>
          </div>
          <DialogCloseButton />
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-700">
          <span aria-hidden className="pulse-dot size-2 shrink-0 rounded-full bg-champagne-400" />
          <span className="font-display shrink-0 tracking-wide">ON AIR</span>
          <span className="min-w-0 truncate font-sans">{loading ? "확인 중..." : onAir}</span>
        </div>
      </header>

      <div className="overflow-y-auto p-4">
        <p className="mb-3 flex gap-2.5 rounded-xl border border-champagne-200 bg-champagne-50 px-3.5 py-3 text-xs leading-6 text-champagne-800">
          <Pencil className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.3} />
          <span>
            <b>{RADIO_MESSAGE_NOTICE}.</b>
            <br />
            아래 칸을 눌러 자유롭게 고칠 수 있고, 고친 그대로 문자에 담깁니다.
          </span>
        </p>

        <label htmlFor="radio-message" className="sr-only">
          보낼 사연
        </label>
        <textarea
          id="radio-message"
          value={pending ? "" : message}
          onChange={(e) => setDraft(e.target.value)}
          disabled={pending}
          rows={7}
          placeholder={pending ? "사연을 불러오는 중입니다." : "보낼 사연을 적어주세요."}
          className="w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm leading-7 text-foreground outline-none transition-colors focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:text-muted"
        />
        <p className="mt-1.5 text-right text-xs font-semibold text-muted">
          {pending ? " " : `${message.length}자`}
        </p>
      </div>

      <footer className="grid gap-2 border-t border-border bg-surface p-4 sm:grid-cols-2">
        {/* 고쳐 쓴 내용은 여기서 버려지고 자동 생성 문장이 새로 들어온다 */}
        <Button variant="outline" size="lg" onClick={handleRefresh}>
          <RefreshCw strokeWidth={2.4} />
          사연 새로 받기
        </Button>
        {canSend ? (
          <Button asChild variant="accent" size="lg">
            <SmartLink href={smsHref(station.number, message, false)} onClick={handleSend}>
              <SendHorizontal strokeWidth={2.4} />
              보내기
            </SmartLink>
          </Button>
        ) : (
          <Button variant="accent" size="lg" disabled>
            <SendHorizontal strokeWidth={2.4} />
            보내기
          </Button>
        )}
      </footer>
    </DialogContent>
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
