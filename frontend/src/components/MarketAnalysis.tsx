'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientApiBaseUrl } from '@/lib/apiBase';

interface MarketStats {
  avg_price: number;
  avg_price_lakh: number;
  min_price: number;
  min_price_lakh: number;
  max_price: number;
  max_price_lakh: number;
  similar_count: number;
}

interface DealAnalysis {
  rating: string;
  emoji: string;
  color: string;
  deviation_percent: number;
  position: string;
  summary: string;
}

interface SimilarListing {
  id: number;
  title: string;
  price: number;
  price_lakh: number;
  location: string;
  model_year: number;
  mileage: number;
  image_url: string;
}

interface MarketData {
  available: boolean;
  message?: string;
  vehicle_id: number;
  vehicle_price?: number;
  vehicle_price_lakh?: number;
  comparison_scope?: string;
  market_stats?: MarketStats;
  deal_analysis?: DealAnalysis;
  similar_listings?: SimilarListing[];
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-900',
    badge: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  blue: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-950',
    badge: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/20',
    glow: 'rgba(14, 165, 233, 0.15)',
  },
  orange: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-950',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  red: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-950',
    badge: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/20',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
};

export default function MarketAnalysis({ vehicleId }: { vehicleId: number }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch(
          `${getClientApiBaseUrl()}/api/listings/${vehicleId}/market-analysis`
        );
        if (!res.ok) throw new Error('Failed');
        const json: MarketData = await res.json();
        setData(json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-lg animate-pulse">
        <div className="h-5 w-44 rounded-lg bg-slate-200 mb-4" />
        <div className="h-16 w-full rounded-2xl bg-slate-100 mb-4" />
        <div className="h-4 w-full rounded bg-slate-100 mb-2" />
        <div className="h-16 w-full rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || !data || !data.available) {
    return null;
  }

  const { market_stats, deal_analysis, similar_listings, comparison_scope } = data;
  if (!market_stats || !deal_analysis) return null;

  const styleConfig = colorMap[deal_analysis.color] || colorMap.blue;

  // Calculate bar position
  const range = market_stats.max_price - market_stats.min_price;
  const barPosition = range > 0
    ? Math.max(0, Math.min(100, ((data.vehicle_price! - market_stats.min_price) / range) * 100))
    : 50;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.04] transition-all">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sm">
            📊
          </span>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Market Intelligence
          </h3>
        </div>
        <span className="truncate max-w-[150px] rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          {comparison_scope}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Deal Rating Banner */}
        <div className={`rounded-2xl border p-4 shadow-sm transition-all ${styleConfig.bg} ${styleConfig.border}`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-md ${styleConfig.badge}`}>
              {deal_analysis.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">{deal_analysis.rating}</span>
                <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 shadow-xs">
                  {deal_analysis.deviation_percent > 0 ? `+${deal_analysis.deviation_percent}%` : `${deal_analysis.deviation_percent}%`}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-700">
                {deal_analysis.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Price Position Visual Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Market Price Gauge</span>
            <span className="text-xs font-bold text-sky-600">Avg: PKR {market_stats.avg_price_lakh} Lakh</span>
          </div>

          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-rose-400 p-[1px]">
            {/* Vehicle current price pointer */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-[3px] border-white bg-slate-950 shadow-lg z-10 transition-all duration-500"
              style={{ left: `${barPosition}%` }}
              title={`Asking: PKR ${data.vehicle_price_lakh} Lakh`}
            />
          </div>

          <div className="mt-2.5 flex justify-between text-[11px] font-bold text-slate-400">
            <span>Low: {market_stats.min_price_lakh}L</span>
            <span>High: {market_stats.max_price_lakh}L</span>
          </div>
        </div>

        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lowest</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{market_stats.min_price_lakh}L</p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Market Avg</p>
            <p className="mt-0.5 text-sm font-black text-sky-900">{market_stats.avg_price_lakh}L</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highest</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{market_stats.max_price_lakh}L</p>
          </div>
        </div>

        <p className="text-center text-[11px] font-semibold text-slate-400">
          Computed across {market_stats.similar_count} verified marketplace listing{market_stats.similar_count !== 1 ? 's' : ''}
        </p>

        {/* Similar Listings Carousel */}
        {similar_listings && similar_listings.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
              Similar Market Listings
            </p>
            <div className="space-y-2">
              {similar_listings.slice(0, 3).map((sl) => (
                <Link
                  key={sl.id}
                  href={`/vehicle/${sl.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 group-hover:text-sky-600">
                      {sl.title}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {sl.location} • {sl.model_year}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-black text-white">
                    {sl.price_lakh}L
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
