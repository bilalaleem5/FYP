'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';

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
};

const PREVIEW = 4;

export default function HomeRecommendationsPreview() {
  const { user, token, loading } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !token) {
      setItems([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const base = getClientApiBaseUrl();
        const res = await fetch(
          `${base}/api/recommendations?limit=${PREVIEW}&faiss_k=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          if (!cancelled) setErr('Could not load personalized picks.');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setErr(null);
        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list.slice(0, PREVIEW));
      } catch {
        if (!cancelled) setErr('Network error.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, token, loading]);

  return (
    <section className="relative mb-16 overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-900/[0.04] sm:p-12">
      {/* Decorative ambient glows */}
      <div
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-700 ring-1 ring-sky-200/60 mb-2">
            <span>✨</span> Curated For You
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Recommended Based on Your AI Activity
          </h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500 max-w-xl">
            Personalized cars calculated from your natural language searches, chat sessions, and vehicle clicks.
          </p>
        </div>

        <Link
          href="/for-you"
          className="shimmer-btn inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
        >
          <span>View All Matches</span>
          <span>→</span>
        </Link>
      </div>

      {!user && !loading && (
        <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Unlock Your Personalized Vehicle Recommendations
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Sign in to see vehicles custom-matched to your search preferences and budget.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-sky-500 transition-colors"
          >
            Log In Now
          </Link>
        </div>
      )}

      {err && user && (
        <p className="relative rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {err}
        </p>
      )}

      {user && items.length > 0 && (
        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((v) => (
            <ListingCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}

      {user && !loading && !err && items.length === 0 && (
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No recommendations generated yet. Try asking our AI assistant or browsing cars in Search!
          </p>
          <div className="mt-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              Browse Search Engine →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
