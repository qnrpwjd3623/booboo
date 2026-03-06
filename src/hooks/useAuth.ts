import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';

const EMAIL_DOMAIN = 'coupleapp.local';

function usernameToEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<{ error: string | null }> => {
    const email = usernameToEmail(username);

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (!signInError) {
      return { error: null };
    }

    // If user doesn't exist, try sign up (first-time setup)
    if (signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (signUpError) {
        return { error: '회원가입 실패: ' + signUpError.message };
      }

      // Try signing in again after signup
      const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
      if (retryError) {
        // Email confirmation might be required
        return { error: '이메일 인증이 필요할 수 있습니다. Supabase 대시보드에서 Email Confirmations를 비활성화하세요.' };
      }

      return { error: null };
    }

    return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, isLoading, signIn, signOut, isAuthenticated: !!user };
}
