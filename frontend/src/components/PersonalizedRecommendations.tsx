'use client';

import { useEffect, useMemo, useState } from 'react';
import ListingCard from '@/components/ListingCard';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { useAuth } from '@/context/AuthContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';
import type { ForYouFilterValues } from '@/components/FilterSidebar';

type Vehicle = {
  id: number;
  title: string;
  price: number;
  currency: string;
  location: string;
  model_year: number;
  mileage: number;
  transmission: string;
  fuel_type: string;
  image_url: string;
  source_url: string;
  make?: string;
};

function normalizeApiMessage(raw: string): string {
  const msg = (raw || '').trim();
  if (!msg) return '';
  if (/Aapki\s+\d+\s+recent\s+searches/i.test(msg) || /basis\s+par\s+yeh\s+recommendations/i.test(msg)) {
    const m = msg.match(/(\d+)/);
    const n = m ? m[1] : '';
    return n
      ? `Matched from your last ${n} activity signal(s) using embeddings + FAISS; saved cars are excluded.`
      : 'Matched from your recent activity signal(s) using embeddings + FAISS; saved cars are excluded.';
  }
  if (/Abhi\s+tak\s+aapne/i.test(msg) || /latest\s+listings\s+hain/i.test(msg)) {
    return 'No activity history yet — here are the newest listings to explore.';
  }
  if (/FAISS\s+index\s+build\s+nahi/i.test(msg) || /vector_store/i.test(msg)) {
    return 'The semantic index is not ready. From the backend folder run: python services/vector_store.py';
  }
  return msg;
}

function filterForYouItems(items: Vehicle[], f: ForYouFilterValues | null | undefined): Vehicle[] {
  if (!f) return items;
  const active = f.make || f.city || f.minPrice || f.maxPrice || f.q;
  if (!active) return items;

  const mk = f.make.trim().toLowerCase();
  const ct = f.city.trim().toLowerCase();
  const kw = f.q.trim().toLowerCase();
  const minP = f.minPrice.trim() ? Number(f.minPrice) : NaN;
  const maxP = f.maxPrice.trim() ? Number(f.maxPrice) : NaN;

  return items.filter((v) => {
    if (mk) {
      const title = (v.title || '').toLowerCase();
      const make = (v.make || '').toLowerCase();
      if (!make.includes(mk) && !title.includes(mk)) return false;
    }
    if (ct) {
      if (!(v.location || '').toLowerCase().includes(ct)) return false;
    }
    if (Number.isFinite(minP) && v.price < minP) return false;
    if (Number.isFinite(maxP) && v.price > maxP) return false;
    if (kw) {
      if (!(v.title || '').toLowerCase().includes(kw)) return false;
    }
    return true;
  });
}

export default function PersonalizedRecommendations({
  showHeading = true,
  showApiMessage = true,
  limit = 250,
  faissK = 250,
  forYouFilters = null,
}: {
  showHeading?: boolean;
  showApiMessage?: boolean;
  limit?: number;
  faissK?: number;
  forYouFilters?: ForYouFilterValues | null;
}) {
  const { user, token, loading } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const displayItems = useMemo(() => filterForYouItems(items, forYouFilters), [items, forYouFilters]);

  useEffect(() => {
    if (loading || !user || !token) {
      setItems([]);
      setSource(null);
      setFetching(false);
      return;
    }

    setFetching(true);
    let cancelled = false;
    (async () => {
      try {
        const q = new URLSearchParams();
        q.set('limit', String(Math.min(limit, 300)));
        q.set('faiss_k', String(Math.min(faissK, 300)));
        const res = await fetch(`${getClientApiBaseUrl()}/api/recommendations?${q.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setErr('Could not load recommendations. Please try again.');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setErr(null);
        setSource(data.source ?? 'unknown');
        setMessage(normalizeApiMessage(data.message ?? ''));
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) {
          setErr(
            `Network error — check that the API is running (${getClientApiBaseUrl()}) or set NEXT_PUBLIC_API_BASE_URL.`
          );
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, token, loading, limit, faissK]);

  if (loading || !user) return null;

  if (fetching) {
    return (
      <section className="mb-8 mt-0">
        {showHeading && <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-6">For you</h1>}
        <SkeletonGrid count={8} />
      </section>
    );
  }

  const showIntro = showHeading || (showApiMessage && !!message);
  const filteredEmpty = !err && items.length > 0 && displayItems.length === 0;

  return (
    <section id="for-you" className="mb-8 mt-0 scroll-mt-28 md:scroll-mt-32">
      {showIntro ? (
        <div className="mb-6">
          {showHeading ? (
            <h1 className="text-3xl font-black tracking-tight text-slate-900">For you</h1>
          ) : null}
          {showApiMessage && message ? (
            showHeading ? (
              <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">{message}</p>
            ) : (
              <div className="inline-flex max-w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white"
                  aria-hidden
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <p className="min-w-0 font-medium">{message}</p>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {err && (
        <p className="mb-4 rounded-2xl border border-amber-200/60 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm">
          {err}
        </p>
      )}

      {!err && items.length === 0 && source === 'none' && (
        <p className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
          The semantic index is not ready yet. From the backend folder run:{' '}
          <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
            python services/vector_store.py
          </code>
        </p>
      )}

      {filteredEmpty && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          No cars match these filters — try clearing or widening the range.
        </p>
      )}

      {!err && displayItems.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-4">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-black tabular-nums text-slate-900">{displayItems.length}</span>
              {items.length !== displayItems.length ? (
                <span className="text-slate-400">
                  {' '}
                  of <span className="font-semibold text-slate-700">{items.length}</span>
                </span>
              ) : null}{' '}
              listings
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayItems.map((v) => (
              <ListingCard key={v.id} vehicle={v} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
