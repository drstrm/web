/*
 * Supabase REST (PostgREST) 직접 호출.
 * SDK 없이 fetch만 사용 — imweb 위젯(todo.html)과 동일한 publishable anon key 사용.
 *
 * 일정 · 할일 데이터는 모두 공용 `schedules` 테이블에 있다(supabase/schedules.sql).
 * imweb 위젯이 쓰던 daily_todos 는 schedules 를 바라보는 호환용 뷰로 남아 있다.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/**
 * PostgREST GET. path 예: "daily_todos?select=*&limit=10"
 * revalidate 를 주면 서버 컴포넌트에서 ISR 캐시를 사용하고(초 단위),
 * 생략하면 기존처럼 매번 새로 조회한다(no-store).
 */
export async function sbGet<T>(path: string, opts?: { revalidate?: number }): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
    );
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    ...(opts?.revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate: opts.revalidate } }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
