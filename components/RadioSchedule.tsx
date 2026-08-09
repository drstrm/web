"use client";

import Image from "next/image";
import { useState } from "react";

type RadioScheduleImage = {
  broadcaster: string;
  src: string;
  width: number;
  height: number;
};

const RADIO_SCHEDULE_IMAGES: RadioScheduleImage[] = [
  {
    broadcaster: "SBS",
    src: "/radio/SBS_2511.png",
    width: 2700,
    height: 4116,
  },
  {
    broadcaster: "KBS",
    src: "/radio/KBS_25.11.png",
    width: 2700,
    height: 3500,
  },
  {
    broadcaster: "MBC",
    src: "/radio/MBC 라디오 25.11.png",
    width: 2700,
    height: 4790,
  },
];

/** public/radio 에 등록된 방송사별 편성표 이미지를 그대로 보여준다. */
export default function RadioSchedule() {
  const [open, setOpen] = useState<string>(RADIO_SCHEDULE_IMAGES[0].broadcaster);

  return (
    <div className="space-y-3">
      {RADIO_SCHEDULE_IMAGES.map((image, index) => {
        const expanded = open === image.broadcaster;
        const panelId = `radio-guide-${image.broadcaster.toLowerCase()}`;

        return (
          <section
            key={image.src}
            className="overflow-hidden rounded-2xl border bg-surface shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(expanded ? "" : image.broadcaster)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-xl">
                📻
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{image.broadcaster}</span>
                <span className="block truncate text-xs text-muted">
                  라디오 신청 가이드 이미지
                </span>
              </span>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 text-sky-500 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M5 8l5 5 5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {expanded && (
              <div id={panelId} className="border-t bg-background">
                <figure>
                  <Image
                    src={image.src}
                    alt={`${image.broadcaster} 라디오 신청 가이드`}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    priority={index === 0}
                    className="h-auto w-full bg-sky-50"
                  />
                  <figcaption className="flex justify-end px-4 py-3">
                    <a
                      href={image.src}
                      download
                      className="rounded-full accent-gradient px-3 py-1.5 text-xs font-bold text-[#5a4a1f]"
                    >
                      이미지 저장
                    </a>
                  </figcaption>
                </figure>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
