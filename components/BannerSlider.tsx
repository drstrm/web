"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import LoadingImage from "@/components/LoadingImage";
import SmartLink from "@/components/SmartLink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/lib/content";

const AUTOPLAY_MS = 5000;
const TRANSITION_MS = 500;

/** main 컨테이너가 max-w-5xl(1024px) 이므로 그 이상은 필요 없다 */
const SIZES = "(max-width: 1024px) 100vw, 1024px";

/**
 * 배경색이 밝은지 판정한다 — 밝은 색 위에서는 흰 글씨가 읽히지 않는다.
 *
 * 배경색은 운영진이 노션에 직접 적는 값이라 무엇이 올지 알 수 없으므로,
 * 글자색을 고정해 두면 언젠가 반드시 안 보이는 배너가 나온다.
 * 기준값 0.2 는 WCAG 상대 휘도 기준으로 흰 글씨와 남색 글씨의 대비가 뒤집히는 지점.
 * 16진수가 아닌 색(`skyblue` 등)은 계산할 수 없으므로 흰 글씨로 둔다.
 */
function isLightColor(color?: string): boolean {
  if (!color?.startsWith("#")) return false;
  const hex = color.slice(1);
  const full =
    hex.length === 3 || hex.length === 4
      ? [...hex.slice(0, 3)].map((c) => c + c).join("")
      : hex;
  if (full.length < 6) return false;

  const channels = [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16) / 255);
  if (channels.some(Number.isNaN)) return false;
  const linear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = channels.map(linear);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2;
}

/**
 * 홈 슬라이드 배너 (기획안 4 필수: 헤더 슬라이더 + 링크 연동)
 *
 * 배너 데이터(이미지 · 링크 · 문구 · 순서)는 전부 노션 DB 에서 온다.
 * 스키마와 운영 방법은 docs/notion-banner-db.md 참고.
 *
 * 컨베이어 방식: [마지막 클론, ...원본, 첫번째 클론] 으로 트랙을 만들고
 * 클론에 도착하면 전환이 끝난 직후 애니메이션 없이 실제 위치로 되돌려 무한 루프처럼 보이게 한다.
 * - 좌우 화살표 클릭 → 한 장 이동
 * - 드래그(스와이프) → 한 장 이동
 * - 페이지네이션 → 현재 위치 표시 전용 (클릭 동작 없음)
 */
export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const n = banners.length;
  const loop = n > 1;
  const slides = loop ? [banners[n - 1], ...banners, banners[0]] : banners;

  const [i, setI] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 재생 타이머 리셋용

  const rootRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false); // 전환 중 중복 이동 방지
  const dragRef = useRef({ active: false, startX: 0, dx: 0, moved: false });

  /** 클론까지 포함한 트랙 범위를 벗어나지 않게 보정 */
  const clamp = useCallback(
    (v: number) => (v < 0 ? n : v > n + 1 ? 1 : v),
    [n],
  );

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!loop || lockRef.current) return;
      lockRef.current = true;
      // transitionend 가 유실되는 경우를 대비한 안전장치
      window.setTimeout(() => {
        lockRef.current = false;
      }, TRANSITION_MS + 200);
      setI((v) => clamp(v + dir));
      setTick((t) => t + 1);
    },
    [clamp, loop],
  );

  // 자동 재생 (드래그 중에는 멈춘다)
  useEffect(() => {
    if (!loop || dragging) return;
    const t = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [dragging, go, loop, tick]);

  /** 클론에 도착했을 때 애니메이션 없이 같은 그림의 실제 슬라이드로 순간 이동 */
  const jump = (to: number) => {
    setAnimate(false);
    setI(to);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  };

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    lockRef.current = false;
    if (!loop) return;
    if (i === 0) jump(n);
    else if (i === n + 1) jump(1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!loop) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { active: true, startX: e.clientX, dx: 0, moved: false };
    lockRef.current = false;
    setDragging(true);
    // 클론 위에서 잡았다면 같은 그림의 실제 슬라이드로 바꿔둔다 (화면상 차이 없음)
    if (i === 0) setI(n);
    else if (i === n + 1) setI(1);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const d = e.clientX - dragRef.current.startX;
    dragRef.current.dx = d;
    if (Math.abs(d) > 4) dragRef.current.moved = true;
    setDx(d);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const d = dragRef.current.dx;
    dragRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const width = rootRef.current?.clientWidth ?? 0;
    const threshold = Math.max(40, width * 0.15);

    setDragging(false);
    setDx(0);
    // 한 장씩만 넘긴다
    if (d <= -threshold) go(1);
    else if (d >= threshold) go(-1);
  };

  // 드래그로 밀었다면 링크 이동은 취소 (스와이프와 클릭 구분)
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    dragRef.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };

  // 노션에 등록된 배너가 없으면 자리만 차지하지 않도록 통째로 숨긴다.
  if (n === 0) return null;

  const active = loop ? (i - 1 + n) % n : i;

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-3xl border border-border shadow-card"
    >
      <div
        className={`flex select-none touch-pan-y ${
          loop ? "cursor-grab active:cursor-grabbing" : ""
        } ${animate && !dragging ? "transition-transform duration-500 ease-out" : ""}`}
        style={{ transform: `translateX(calc(${-i * 100}% + ${dx}px))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
        onTransitionEnd={onTransitionEnd}
      >
        {slides.map((b, idx) => {
          // 앞뒤 클론은 스크린리더 · 탭 이동에서 제외
          const isClone = loop && (idx === 0 || idx === slides.length - 1);
          const hasText = Boolean(b.title || b.subtitle);
          // 이미지 위에는 어둡게 깔고 흰 글씨, 배경색 위에는 색에 맞춰 글씨색을 고른다.
          const onDark = b.image || !isLightColor(b.background);
          const inner = (
            <div
              className="relative aspect-[16/9] w-full overflow-hidden bg-sky-100 sm:aspect-[21/9]"
              style={b.image ? undefined : { backgroundColor: b.background }}
            >
              {b.image && (
                <LoadingImage
                  src={b.image}
                  alt={b.alt}
                  fill
                  sizes={SIZES}
                  // 첫 장은 화면 최상단에 바로 보이므로 지연 없이 받는다.
                  priority={idx <= 1}
                  draggable={false}
                  className="object-cover"
                />
              )}
              {hasText && (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center ${
                    b.image ? "bg-gradient-to-t from-black/55 via-black/15 to-transparent" : ""
                  } ${onDark ? "text-white" : "text-[#0f1b2d]"}`}
                >
                  {b.title && (
                    <h2
                      className={`text-xl font-extrabold sm:text-3xl ${b.image ? "drop-shadow" : ""}`}
                    >
                      {b.title}
                    </h2>
                  )}
                  {b.subtitle && (
                    <p
                      className={`text-sm font-semibold opacity-95 sm:text-base ${
                        b.image ? "drop-shadow" : ""
                      }`}
                    >
                      {b.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
          return b.href ? (
            // 새 탭 여부는 SmartLink 가 정한다 (노션에 외부 주소가 대부분이다)
            <SmartLink
              key={`${b.id}-${idx}`}
              href={b.href}
              draggable={false}
              aria-hidden={isClone || undefined}
              tabIndex={isClone ? -1 : undefined}
              className="w-full shrink-0"
            >
              {inner}
            </SmartLink>
          ) : (
            <div
              key={`${b.id}-${idx}`}
              aria-hidden={isClone || undefined}
              className="w-full shrink-0"
            >
              {inner}
            </div>
          );
        })}
      </div>

      {loop && (
        <>
          {/* 좌우 화살표 */}
          <button
            type="button"
            aria-label="이전 배너"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/75 text-foreground shadow-card backdrop-blur transition hover:bg-white active:scale-95 sm:left-4 sm:size-11"
          >
            <ChevronLeft className="size-4 sm:size-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="다음 배너"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/75 text-foreground shadow-card backdrop-blur transition hover:bg-white active:scale-95 sm:right-4 sm:size-11"
          >
            <ChevronRight className="size-4 sm:size-5" strokeWidth={2.5} />
          </button>

          {/* 페이지네이션: 현재 위치 표시 전용 (클릭 동작 없음) */}
          <div
            aria-hidden
            // 밝은 배너 이미지 위에서도 보이도록 반투명 알약을 깐다.
            className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm"
          >
            {banners.map((b, idx) => (
              <span
                key={b.id}
                className={`h-1.5 rounded-full transition-all ${
                  idx === active ? "w-5 bg-champagne-400" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
