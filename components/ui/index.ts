/*
 * 디자인 시스템 진입점
 * ------------------------------------------------------------------
 * 화면은 `@/components/ui` 하나만 import 한다. 아이콘은 lucide-react,
 * 변형(variant)은 class-variance-authority, 클래스 병합은 tailwind-merge 가
 * 맡고, 접근성이 필요한 위젯(Dialog · Accordion)은 Radix 위에 얹었다.
 *
 * 색 토큰은 app/globals.css 한 곳에만 있다.
 */

export { Button, buttonVariants, type ButtonProps } from "./button";
export { Badge, badgeVariants } from "./badge";
export { Card } from "./card";
export { HubCard } from "./hub-card";
export { IconTile, iconTileVariants } from "./icon-tile";
export { PageHeader, SectionTitle, Notice } from "./typography";
export { EmptyState, ComingSoon } from "./empty-state";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "./dialog";
