import Image from 'next/image';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import BrowseUsedCars from '@/components/BrowseUsedCars';
import HomeRecommendationsPreview from '@/components/HomeRecommendationsPreview';
import { getApiBaseUrl } from '@/lib/apiBase';
import { AppleIcon, GooglePlayIcon, BotIcon, ChartBarIcon, ShieldCheckIcon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

async function getFeaturedListings() {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/listings?limit=8`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Listings API returned ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || []);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[VehicleWalay] Could not reach listings API at ${base}. Start FastAPI (e.g. from backend: uvicorn main:app --reload --port 8000).`
      );
    }
    return [];
  }
}

export default async function Home() {
  const apiBase = getApiBaseUrl();
  const featuredListings = await getFeaturedListings();

  return (
    <div className="bg-[#f8fafc] pb-24 overflow-hidden">
      {/* ─── Modern Luxury Automotive Hero ─── */}
      <section className="relative isolate flex min-h-[640px] flex-col justify-center overflow-hidden pb-24 pt-28 sm:min-h-[700px] sm:pb-32 sm:pt-36">
        {/* Ambient Dark Automotive Background with Real Aston Martin Supercar */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-100 transition-transform duration-1000"
          style={{
            backgroundImage: 'url("/auth-bg.png")',
          }}
        />
        {/* Dark Vignette Overlay to ensure text readability while keeping the car & lights prominent */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/95" />

        {/* Ambient glow orbs */}
        <div className="ambient-glow -top-32 left-1/2 h-[450px] w-[600px] -translate-x-1/2 bg-sky-500/20 blur-[120px]" />
        <div className="ambient-glow top-40 right-10 h-[350px] w-[350px] bg-indigo-500/15 blur-[100px]" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center sm:px-6">
          {/* Live Badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-sky-400/30 bg-sky-950/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-300 shadow-lg shadow-sky-950/50 backdrop-blur-xl animate-float">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Pakistan’s Smart Automotive Marketplace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:leading-[1.1]">
            Find Cars Smarter. <br />
            <span className="gradient-text-sky drop-shadow-[0_10px_25px_rgba(56,189,248,0.25)]">
              Driven by AI.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
            Natural language car search, instant market price analysis, and verified seller listings across Pakistan.
          </p>

          {/* High-Tech Interactive Search Console */}
          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/20 bg-slate-900/75 p-2.5 shadow-2xl shadow-slate-950/80 ring-1 ring-white/10 backdrop-blur-xl">
            <form action="/search" method="GET" className="flex flex-col divide-y divide-slate-800/80 overflow-hidden rounded-2xl bg-white/95 md:flex-row md:divide-x md:divide-y-0">
              <label className="flex min-h-[3.75rem] flex-1 cursor-text items-center gap-3.5 px-5 py-3">
                <svg className="h-5 w-5 shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="e.g. Honda Civic, Automatic SUV, Prado under 60 lakh..."
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  required
                />
              </label>

              <div className="flex items-center bg-slate-100/70 px-4 py-3 md:w-52 md:py-0">
                <svg className="mr-2 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <select
                  name="city"
                  className="h-full w-full cursor-pointer bg-transparent text-sm font-bold text-slate-700 focus:outline-none md:py-4"
                  defaultValue=""
                >
                  <option value="">All Cities</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>

              <button
                type="submit"
                className="shimmer-btn group flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-sky-500/40 md:min-w-[10.5rem]"
              >
                <span>Search</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </button>
            </form>
          </div>

          {/* Popular Tag Pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular Searches:</span>
            {[
              { href: '/search?make=Honda&q=Civic', label: 'Honda Civic' },
              { href: '/search?make=Toyota&q=Corolla', label: 'Toyota Corolla' },
              { href: '/search?make=Toyota&q=Prado', label: 'Toyota Prado' },
              { href: '/search?fuel_type=Hybrid', label: 'Hybrid Vehicles' },
              { href: '/search?transmission=Automatic', label: 'Automatic Cars' },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-sky-400/60 hover:bg-sky-500/20 hover:text-white hover:shadow-lg hover:shadow-sky-500/20"
              >
                <svg className="h-3 w-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Key Features Banner ─── */}
      <div className="relative z-20 mx-auto -mt-10 max-w-[1400px] px-4 sm:-mt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {[
            {
              title: 'Smart AI Assistant',
              body: 'Discover vehicles in your budget using natural language. Compare mileage, specs, and price trends effortlessly.',
              badge: 'Natural Search',
              icon: <BotIcon className="h-6 w-6 text-sky-600" />,
              glow: 'from-sky-500/20 to-blue-600/10',
            },
            {
              title: 'Market Price Analysis',
              body: 'Automated valuation highlights whether a car is a Great Deal, Fair Price, or Overpriced before making an offer.',
              badge: 'Fair Valuation',
              icon: <ChartBarIcon className="h-6 w-6 text-emerald-600" />,
              glow: 'from-emerald-500/20 to-teal-600/10',
            },
            {
              title: 'Verified Seller Shield',
              body: 'Automated listing verification and price checking algorithms safeguard buyers against suspicious ads.',
              badge: 'Buyer Protection',
              icon: <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />,
              glow: 'from-indigo-500/20 to-purple-600/10',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="card-motion group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-lg shadow-slate-900/[0.03]"
            >
              <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${card.glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
              <div className="relative z-10 flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-inner ring-1 ring-slate-200/80 transition-transform duration-300 group-hover:scale-110">
                  {card.icon}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  {card.badge}
                </span>
              </div>
              <div className="relative z-10 mt-5">
                <h3 className="text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-sky-600">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Browse Categories Section ─── */}
        <div className="mt-14">
          <BrowseUsedCars />
        </div>

        {/* ─── Personalized Recommendations Preview ─── */}
        <div className="mt-12">
          <HomeRecommendationsPreview />
        </div>

        {/* ─── How It Works (Workflow) ─── */}
        <section className="my-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-200/60 mb-3">
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            How VehicleWalay Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500 sm:text-base">
            From smart natural language exploration to verified contact — built with cutting-edge AI architecture.
          </p>

          <div className="relative mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <div className="pointer-events-none absolute left-[15%] right-[15%] top-10 hidden h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 md:block" aria-hidden />

            {[
              {
                step: '01',
                title: 'Natural Language Search',
                body: 'Search with filters or chat in plain words like “Automatic Honda Civic in Lahore under 50 lakh”.',
                badge: 'FAISS Semantic Index',
              },
              {
                step: '02',
                title: 'Review Market Valuation',
                body: 'Analyze price comparison bars, seller ratings, and real-time deal badges before deciding.',
                badge: 'Market Algorithm',
              },
              {
                step: '03',
                title: 'Connect & Shortlist',
                body: 'Save cars to your private garage, receive notifications, and contact verified owners.',
                badge: 'Verified Deals',
              },
            ].map((s, idx) => (
              <div key={s.step} className="card-motion group relative z-10 flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-md">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-lg font-black tracking-tight text-white shadow-lg shadow-sky-500/30 transition-transform duration-300 group-hover:scale-110">
                  {s.step}
                </div>
                <span className="rounded-md bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 mb-2">
                  {s.badge}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Featured Inventory Section ─── */}
        <section className="mb-16 overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.04]">
          <div className="flex flex-col gap-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Inventory</span>
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Featured Vehicles
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Directly synchronized from Pakistani automotive listings.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
            >
              <span>Explore All Listings</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-8 sm:p-12">
            {featuredListings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                  🚗
                </div>
                <h3 className="text-xl font-black text-slate-900">No listings loaded yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
                  Run the scraper (`python scraper/async_scraper.py`) or start the FastAPI server to populate listings.
                </p>
                <div className="mt-6">
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-sky-500"
                  >
                    Open Search Engine
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredListings.map((vehicle: any) => (
                  <ListingCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Mobile App Showcase CTA Banner ─── */}
        <section className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl md:flex md:items-center md:justify-between md:gap-12 md:p-16 border border-slate-800/80">
          <div className="ambient-glow -right-20 -top-20 h-96 w-96 rounded-full bg-sky-600/25 blur-[120px]" />
          <div className="ambient-glow -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-600/25 blur-[120px]" />

          <div className="relative z-10 max-w-xl text-center md:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              Mobile Companion
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl lg:leading-tight">
              Your dream car, <br className="hidden md:block"/> now in your <span className="gradient-text-sky">pocket.</span>
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-400">
              Instant alerts on price drops, multi-turn AI advice on the go, and direct seller connectivity.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
              <button
                type="button"
                className="group relative inline-flex items-center justify-center gap-3.5 overflow-hidden rounded-2xl bg-white px-7 py-3.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
              >
                <AppleIcon className="h-7 w-7 text-slate-950 shrink-0" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Download on the</span>
                  <span className="text-base font-black text-slate-900">App Store</span>
                </div>
              </button>
              <button
                type="button"
                className="group relative inline-flex items-center justify-center gap-3.5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/90 px-7 py-3.5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800"
              >
                <GooglePlayIcon className="h-7 w-7 shrink-0" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Get it on</span>
                  <span className="text-base font-black text-white">Google Play</span>
                </div>
              </button>
            </div>
          </div>

          {/* Realistic High-Tech Mobile Device Mockup */}
          <div className="relative z-10 mx-auto mt-12 flex justify-center md:mx-0 md:mt-0">
            <div className="relative w-[300px] rounded-[3rem] border-[8px] border-slate-800 bg-slate-950 shadow-2xl transition duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(56,189,248,0.25)]">
              {/* Dynamic Island */}
              <div className="absolute inset-x-0 top-0 z-20 mx-auto flex h-6 w-32 items-center justify-center gap-2 rounded-b-3xl bg-slate-800">
                <div className="h-2 w-2 rounded-full bg-slate-950" />
                <div className="h-2 w-10 rounded-full bg-slate-950" />
              </div>
              
              <div className="relative flex flex-col overflow-hidden rounded-[2.2rem] bg-slate-950 p-4 pt-9">
                {/* App Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md bg-sky-500 flex items-center justify-center text-[10px] font-black text-white">
                      VW
                    </div>
                    <span className="text-xs font-black text-white">VehicleWalay</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">● LIVE</span>
                </div>

                {/* AI Assistant Chat Query */}
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-inner">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>AI Assistant Match</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-200">“Automatic Honda Civic in Lahore under 55 Lakh”</p>
                </div>

                {/* Matched Car Card */}
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src="/auth-bg-light.png"
                      alt="Verified Vehicle"
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-white shadow">
                      VERIFIED DEAL
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-black text-white">Honda Civic Oriel 1.8 i-VTEC</p>
                    <p className="mt-0.5 text-xs font-black text-sky-400">PKR 54.5 Lakh</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>2021 • 45k km</span>
                      <span className="text-emerald-400 font-bold">98% Valuation Match</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition-colors"
                >
                  Contact Seller Directly
                </button>

                {/* Bottom App Nav Bar Mockup */}
                <div className="mt-3 flex items-center justify-around border-t border-slate-800/80 pt-2 text-[10px] font-semibold text-slate-400">
                  <span className="text-sky-400 font-bold">Home</span>
                  <span>Search</span>
                  <span>Garage</span>
                  <span>Account</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
