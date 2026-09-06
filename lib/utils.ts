import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 클래스 합치기.
 * tailwind-merge 를 거치므로 뒤에 넘긴 클래스가 앞의 같은 속성을 확실히 이긴다
 * (`cn("px-4", "px-6")` → `px-6`). 컴포넌트가 기본 스타일을 갖고 있어도 호출부에서
 * className 하나로 덮어쓸 수 있다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
