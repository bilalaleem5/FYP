'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import FilterSidebar, { type ForYouFilterValues } from '@/components/FilterSidebar';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { SkeletonGrid } from '@/components/SkeletonCard';

export default function ForYouClient() {
  const { user, loading } = useAuth();
  const [forYouFilters, setForYouFilters] = useState<ForYouFilterValues | null>(null);

  const appliedParams =
    forYouFilters === null
      ? undefined
      : {
          make: forYouFilters.make,
          city: forYouFilters.city,
          min_price: forYouFilters.minPrice,
          max_price: forYouFilters.maxPrice,
          q: forYouFilters.q,
        };

  if (loading) {
    return (
      <div className="space-y-6 py-6">
        <div className="h-10 w-64 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-4 max-w-xl rounded-lg bg-slate-100 animate-pulse" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative py-12 flex justify-center">
        {/* Ambient glow */}
        <div className="ambient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[500px] bg-sky-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-lg w-full rounded-[2.5rem] border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-2xl shadow-sky-950/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 text-3xl text-white shadow-xl shadow-sky-500/30">
            ✨
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
            AI Personalized Feed
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Curated Exclusively For You
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            Sign in to unlock personalized listings matched dynamically to your search history, viewed cars, and AI chat conversations.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="shimmer-btn rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-600/30 hover:scale-105 transition-all"
            >
              Sign In to Unlock
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-white hover:border-slate-300"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
            <span>⚡ FAISS Similarity Matching</span>
            <span>•</span>
            <span>🛡️ Real-Time Price Analysis</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Modern High-Tech Recommendations Header */}
      <header className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-gradient-to-br from-white via-sky-50/40 to-slate-50 px-6 py-8 shadow-xl shadow-slate-900/[0.03] sm:px-10 sm:py-10">
        <div className="ambient-glow -right-20 -top-20 h-64 w-64 bg-sky-400/20 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link href="/" className="text-slate-500 transition hover:text-sky-600">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sky-600 font-extrabold flex items-center gap-1">
              <span>✨</span> Personalized Recommendations
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Vehicles Matched to Your <span className="gradient-text-sky">Taste</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                Generated via 384-dimensional FAISS embeddings based on your searches, AI chat interactions, and vehicle views.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-white border border-slate-200/90 px-4 py-2.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-700">Live AI Vector Sync Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar and Grid */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-[320px]">
          <FilterSidebar
            mode="forYou"
            currentParams={appliedParams}
            onApplyForYou={(f) => setForYouFilters(f)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <PersonalizedRecommendations
            showHeading={false}
            showApiMessage={true}
            limit={300}
            faissK={300}
            forYouFilters={forYouFilters}
          />
        </div>
      </div>
    </div>
  );
}
