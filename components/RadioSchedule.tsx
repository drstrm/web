"use client";

import { ImageDown, Radio } from "lucide-react";
import LoadingImage from "@/components/LoadingImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  IconTile,
} from "@/components/ui";

type RadioScheduleImage = {
  broadcaster: string;
  src: string;
  width: number;
  height: number;
};

const RADIO_SCHEDULE_IMAGES: RadioScheduleImage[] = [
  {
    broadcaster: "SBS",
    src: "/radio/SBS-2609.png",
    width: 2700,
    height: 4100,
  },
  {
    broadcaster: "KBS",
    src: "/radio/KBS-2609.png",
    width: 2700,
    height: 3500,
  },
  {
    broadcaster: "MBC",
    src: "/radio/MBC-2609.png",
    width: 2700,
    height: 3800,
  },
];

/** public/radio 에 등록된 방송사별 편성표 이미지를 그대로 보여준다. */
export default function RadioSchedule() {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={RADIO_SCHEDULE_IMAGES[0].broadcaster}
      className="space-y-3"
    >
      {RADIO_SCHEDULE_IMAGES.map((image, index) => (
        <AccordionItem key={image.src} value={image.broadcaster}>
          <AccordionTrigger>
            <IconTile tone="sky" size="lg">
              <Radio strokeWidth={2.2} />
            </IconTile>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-extrabold tracking-tight">
                {image.broadcaster}
              </span>
              <span className="block truncate text-xs text-muted">
                라디오 신청 가이드 이미지
              </span>
            </span>
          </AccordionTrigger>

          <AccordionContent>
            <figure>
              <LoadingImage
                src={image.src}
                alt={`${image.broadcaster} 라디오 신청 가이드`}
                width={image.width}
                height={image.height}
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority={index === 0}
                wrapperClassName="bg-sky-50"
                className="block h-auto w-full"
              />
              <figcaption className="flex justify-end px-4 py-3">
                {/* 이동이 아니라 파일 저장이라 SmartLink 를 쓰지 않는다 */}
                <Button asChild variant="accent" size="sm">
                  <a href={image.src} download>
                    <ImageDown strokeWidth={2.4} />
                    이미지 저장
                  </a>
                </Button>
              </figcaption>
            </figure>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
