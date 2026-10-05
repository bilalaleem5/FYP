'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';

export default function VehicleViewLogger({ vehicleId, summaryLine }: { vehicleId: number; summaryLine: string }) {
  const { user, token } = useAuth();
  const sent = useRef(false);

  useEffect(() => {
    const q = summaryLine.trim();
    if (!q || !user?.id || !token || sent.current) return;

    const storageKey = `vw_hist_view_${user.id}_${vehicleId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      sent.current = true;
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
          sent.current = true;
          if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1');
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, summaryLine, user?.id, token]);

  return null;
}
