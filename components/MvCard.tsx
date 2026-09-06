"use client";

import { Heart, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import type { MvStat } from "@/lib/content";
import { fetchMvLiveStats, type MvLiveStats } from "@/lib/mv";

/**
 * 유튜브 MV 카드
 *
 * 임베드와 제목은 서버가 그린 그대로 두고, 조회수·좋아요만 브라우저가
 * /api/mv-stats 에서 다시 받아 덮어쓴다. 홈은 300초 ISR 이라 서버가 넣어 준
 * 값은 최대 5분 묵어 있는데, 이 두 숫자만은 접속·새로고침 시점 기준이어야 한다.
 *
 * 마운트할 때 한 번만 부른다. 새로고침은 물론 다른 화면에서 홈으로 돌아오는
 * 클라이언트 이동에서도 다시 마운트되므로 그때마다 최신값이 들어온다.
 */
export default function MvCard({ mv }: { mv: MvStat[] }) {
  const [live, setLive] = useState<Record<string, MvLiveStats>>({});

  useEffect(() => {
    let alive = true;

    fetchMvLiveStats()
      .then((data) => {
        if (alive) setLive(data);
      })
      // 실패하면 서버가 준 값("—")을 그대로 둔다 — 카드는 계속 보인다.
      .catch((e) => console.error(e));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card className="overflow-hidden p-0">
      {mv.map((m) => {
        const stats = live[m.youtubeId];

        return (
          <div key={m.title}>
            <div className="grid aspect-video place-items-center bg-sky-50 text-sm text-muted">
              {m.youtubeId ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${m.youtubeId}`}
                  title={m.title}
                  allowFullScreen
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-xs">
                  <Play className="size-6 text-sky-300" strokeWidth={2} />
                  MV 임베드 연동 예정
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="min-w-0 truncate font-bold">{m.title}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-1">
                  <Play className="size-3 shrink-0" strokeWidth={2.5} />
                  {stats?.views || m.views}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3 shrink-0" strokeWidth={2.5} />
                  {stats?.likes || m.likes}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
