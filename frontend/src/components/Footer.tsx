import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Multan", "Sialkot"];

  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#090d16] text-slate-400 relative overflow-hidden">
      {/* Top Quick City Discovery Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-4">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Find Cars in Your City:
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/search?city=${city}`}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand Info & Mission */}
          <div className="space-y-4 lg:col-span-2 pr-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src="/logo.png"
                  alt="VehicleWalay Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white leading-none">
                  Vehicle<span className="text-sky-400">Walay</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                  Smart Auto Marketplace
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-400">
              Pakistan’s premier automotive portal. Search thousands of verified used and new cars, compare fair market valuations, and connect directly with trusted private sellers and dealers.
            </p>

            {/* Genuine Trust Badges */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                <span>Zero Commission on Direct Buyer-Seller Deals</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">✓</span>
                <span>Automated Fair Price Valuation & Deal Badges</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">✓</span>
                <span>Verified Seller Listings Across All Major Cities</span>
              </div>
            </div>
          </div>

          {/* Body Types */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-200">
              Browse by Category
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/search?transmission=Automatic" className="hover:text-white transition-colors">
                  Automatic Cars
                </Link>
              </li>
              <li>
                <Link href="/search?body_type=Sedan" className="hover:text-white transition-colors">
                  Family Sedans
                </Link>
              </li>
              <li>
                <Link href="/search?body_type=SUV" className="hover:text-white transition-colors">
                  Luxury SUVs & 4x4
                </Link>
              </li>
              <li>
                <Link href="/search?body_type=Hatchback" className="hover:text-white transition-colors">
                  Budget Hatchbacks
                </Link>
              </li>
              <li>
                <Link href="/search?fuel_type=Hybrid" className="hover:text-white transition-colors">
                  Hybrid & Electric Cars
                </Link>
              </li>
              <li>
                <Link href="/search?q=Japanese" className="hover:text-white transition-colors">
                  Japanese Imported Cars
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Models */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-200">
              Popular Models
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/search?make=Honda&q=Civic" className="hover:text-white transition-colors">
                  Honda Civic
                </Link>
              </li>
              <li>
                <Link href="/search?make=Toyota&q=Corolla" className="hover:text-white transition-colors">
                  Toyota Corolla
                </Link>
              </li>
              <li>
                <Link href="/search?make=Suzuki&q=Alto" className="hover:text-white transition-colors">
                  Suzuki Alto
                </Link>
              </li>
              <li>
                <Link href="/search?make=Suzuki&q=Cultus" className="hover:text-white transition-colors">
                  Suzuki Cultus
                </Link>
              </li>
              <li>
                <Link href="/search?make=KIA&q=Sportage" className="hover:text-white transition-colors">
                  KIA Sportage
                </Link>
              </li>
              <li>
                <Link href="/search?make=Toyota&q=Prado" className="hover:text-white transition-colors">
                  Toyota Prado
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Tools */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-200">
              Tools & Services
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/sell" className="hover:text-white text-sky-400 font-semibold transition-colors">
                  + Post Free Ad
                </Link>
              </li>
              <li>
                <Link href="/for-you" className="hover:text-white transition-colors">
                  AI Recommendations
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-white transition-colors">
                  Saved Vehicle Garage
                </Link>
              </li>
              <li>
                <Link href="/my-ads" className="hover:text-white transition-colors">
                  My Posted Listings
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Search Vehicle Directory
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & FAST-NUCES FYP tag */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} VehicleWalay. All rights reserved.</p>
          
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <span>FAST National University of Computer & Emerging Sciences (NUCES)</span>
            <span>•</span>
            <span>Final Year Project 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-medium">
            <Link href="/search" className="hover:text-slate-300 transition-colors">Search</Link>
            <Link href="/sell" className="hover:text-slate-300 transition-colors">Sell Car</Link>
            <Link href="/saved" className="hover:text-slate-300 transition-colors">Garage</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
