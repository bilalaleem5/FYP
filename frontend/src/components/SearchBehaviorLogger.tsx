'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';

export default function SearchBehaviorLogger({ line }: { line: string }) {
  const { user, token } = useAuth();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const q = line.trim();
    if (!q || !user?.id || !token) return;
    if (lastSent.current === q) return;

    const storageKey = `vw_hist_search_${user.id}_${q}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      lastSent.current = q;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getClientApiBaseUrl()}/api/search-history`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: q }),
        });
        if (!cancelled && res.ok) {
          lastSent.current = q;
          if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1');
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [line, user?.id, token]);

  return null;
}
