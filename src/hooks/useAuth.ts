import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';

const EMAIL_DOMAIN = 'gmail.com';

function usernameToEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

export function getHouseholdId(user: User | null): string | null {
  if (!user) return null;

  const appHouseholdId = user.app_metadata?.household_id;
  if (typeof appHouseholdId === 'string' && appHouseholdId.trim()) {
    return appHouseholdId;
  }

  const userHouseholdId = user.user_metadata?.household_id;
  if (typeof userHouseholdId === 'string' && userHouseholdId.trim()) {
    return userHouseholdId;
  }

  return user.id;
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
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
