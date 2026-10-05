"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SparklesIcon, HeartIcon, CarIcon } from "@/components/Icons";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-sm"
            : "border-b border-slate-200/60 bg-white/90 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo - Crisp & Natural */}
          <Link
            href="/"
            className="group flex items-center gap-3 shrink-0"
            onClick={closeMobile}
          >
            <div className="relative h-12 w-12 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="VehicleWalay"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                Vehicle<span className="text-sky-600">Walay</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Smart Auto Marketplace
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links */}
          <nav
            className="hidden items-center gap-1 xl:gap-2 lg:flex"
            aria-label="Primary"
          >
            <Link
              href="/search"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-600"
            >
              Browse Cars
            </Link>
            <Link
              href="/search?transmission=Automatic"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-600"
            >
              Automatic
            </Link>
            <Link
              href="/search?body_type=SUV"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-600"
            >
              SUVs & 4x4
            </Link>
            <Link
              href="/search?fuel_type=Hybrid"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-600"
            >
              Hybrid & EV
            </Link>
            <Link
              href="/for-you"
              className="group relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <SparklesIcon className="h-4 w-4 text-sky-600 transition-transform duration-300 group-hover:rotate-12" />
              <span>For You</span>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            </Link>
          </nav>

          {/* Right Action Icons / Auth Controls */}
          <div className="flex items-center gap-3">
            {!loading && user && (
              <Link
                href="/saved"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
                title="Saved Garage"
              >
                <HeartIcon className="h-4 w-4 text-rose-500" filled />
                <span>Garage</span>
              </Link>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            )}

            {!loading && user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-white transition-all cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-xs font-bold text-white shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      userDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400 font-semibold">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    </div>
                    <Link
                      href="/my-ads"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                    >
                      <CarIcon className="h-4 w-4 text-sky-600" />
                      <span>My Listed Cars</span>
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                    >
                      <HeartIcon className="h-4 w-4 text-rose-500" filled />
                      <span>Saved Garage</span>
                    </Link>
                    <Link
                      href="/for-you"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                    >
                      <SparklesIcon className="h-4 w-4 text-sky-600" />
                      <span>Recommended For You</span>
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Genuine High-Contrast Post Ad Button */}
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <span>+ Post an Ad</span>
              <span className="hidden sm:inline">→</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:text-sky-600 lg:hidden"
              aria-label="Open navigation menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md lg:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <span className="text-lg font-black text-slate-900">
                  Vehicle<span className="text-sky-600">Walay</span>
                </span>
                <button
                  type="button"
                  onClick={closeMobile}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-2">
                <Link
                  href="/search"
                  onClick={closeMobile}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-600"
                >
                  🔍 Browse All Cars
                </Link>
                <Link
                  href="/search?transmission=Automatic"
                  onClick={closeMobile}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-600"
                >
                  ⚡ Automatic Cars
                </Link>
                <Link
                  href="/search?body_type=SUV"
                  onClick={closeMobile}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-600"
                >
                  🚙 SUVs & 4x4
                </Link>
                <Link
                  href="/search?fuel_type=Hybrid"
                  onClick={closeMobile}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-600"
                >
                  🔋 Hybrid & Electric
                </Link>
                <Link
                  href="/for-you"
                  onClick={closeMobile}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-sky-600 bg-sky-50 flex items-center justify-between"
                >
                  <span>✨ Recommended For You</span>
                  <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">
                    AI
                  </span>
                </Link>

                <div className="pt-4 border-t border-slate-100 mt-2">
                  <Link
                    href="/saved"
                    onClick={closeMobile}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <span>❤️ Saved Garage</span>
                  </Link>
                  <Link
                    href="/my-ads"
                    onClick={closeMobile}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                  >
                    <span>🚗 My Listed Ads</span>
                  </Link>
                </div>
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <Link
                href="/sell"
                onClick={closeMobile}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-md"
              >
                <span>+ Post Free Ad</span>
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    logout();
                  }}
                  className="w-full rounded-xl border border-slate-200 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
