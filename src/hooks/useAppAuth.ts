'use client';

import { createClient, hasSupabaseClientEnv } from '@/lib/supabase/client';
import { useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface AppAuthState {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
}

/** Read the stored Supabase session cookie synchronously so queries can start
 *  before the first async round-trip completes. */
function readSessionUserIdSync(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqIdx = cookie.indexOf('=');
      if (eqIdx < 0) continue;
      const name = cookie.slice(0, eqIdx).trim();
      if (!name.startsWith('sb-') || !name.endsWith('-auth-token')) continue;
      const raw = decodeURIComponent(cookie.slice(eqIdx + 1).trim());
      const parsed = JSON.parse(raw) as { user?: { id?: string }; access_token?: string };
      if (parsed?.user?.id && parsed?.access_token) return parsed.user.id;
    }
  } catch { /* ignore */ }
  return null;
}

export function useAppAuth(): AppAuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // useIsomorphicLayoutEffect runs synchronously before paint on the client,
  // which lets us set the session state before the first render that needs it.
  useIsomorphicLayoutEffect(() => {
    // Try to read existing session synchronously from cookie
    const cachedId = readSessionUserIdSync();
    if (cachedId) {
      setUserId(cachedId);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseClientEnv()) {
      setUserId(null);
      setIsLoaded(true);
      return;
    }

    const supabase = createClient();

    // Confirm/correct the session asynchronously (validates expiry etc.)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    getToken: async () => {
      if (!hasSupabaseClientEnv()) return null;
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    },
    isLoaded,
    isSignedIn: Boolean(userId),
    userId,
  };
}
