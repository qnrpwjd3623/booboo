import { supabase } from './supabaseClient';

export async function authorizationHeaders(): Promise<Record<string, string>> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('로그인이 필요합니다.');
  return { Authorization: `Bearer ${session.access_token}` };
}
