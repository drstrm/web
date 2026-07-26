/*
 * Supabase REST (PostgREST) 직접 호출.
 * SDK 없이 fetch만 사용 — imweb 위젯(todo.html)과 동일한 publishable anon key 사용.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vkxayfaupthmwiblwpap.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_fMUcEY1celAcysrmOUqBWQ_bZY55ZpI";

/** PostgREST GET. path 예: "daily_todos?select=*&limit=10" */
export async function sbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
