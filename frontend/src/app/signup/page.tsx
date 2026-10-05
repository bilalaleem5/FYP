"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getClientApiBaseUrl } from "@/lib/apiBase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const base = getClientApiBaseUrl();
      // 1. Signup
      const signupRes = await fetch(`${base}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.detail || "Failed to create account. Email may already be in use.");
      }

      // 2. Login automatically
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const loginRes = await fetch(`${base}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();

        // Fetch user profile
        const userRes = await fetch(`${base}/api/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const userData = await userRes.json();

        login(data.access_token, userData);
        showToast(`Account created! Welcome to VehicleWalay, ${userData.name}! 🎉`, "success");
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex w-full bg-slate-950 text-white overflow-hidden relative">
      {/* Left side - Signup Form Container */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-900/90 backdrop-blur-3xl shadow-[20px_0_50px_rgba(0,0,0,0.5)] border-r border-slate-800/80 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo Brand Link */}
          <Link
            href="/"
            className="flex items-center gap-3 mb-10 group inline-flex hover:opacity-90 transition-opacity"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
              VW
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Vehicle<span className="text-sky-400">Walay</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              Join the Network
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Create Your Account
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Join Pakistan’s premier AI-powered automotive community today.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-800/80 text-red-300 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium text-sm transition-all"
                placeholder="Bilal Ahmed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium text-sm transition-all"
                placeholder="bilal@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium text-sm tracking-widest transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`shimmer-btn w-full mt-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-600/30 hover:scale-[1.01] hover:shadow-sky-500/40 transition-all flex justify-center items-center gap-2 text-sm ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-slate-400 mt-8 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-sky-400 font-bold hover:text-sky-300 transition-colors ml-1 underline underline-offset-4"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Luxury Showcase */}
      <div className="hidden lg:block w-[55%] relative bg-slate-950">
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=85&w=1600"
          alt="Premium luxury car"
          fill
          sizes="60vw"
          className="object-cover object-center"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30 z-10" />

        {/* Floating Feature Badges */}
        <div className="absolute top-12 right-12 z-20 flex flex-col gap-3">
          <div className="rounded-2xl border border-white/20 bg-slate-900/70 backdrop-blur-xl px-4 py-2.5 shadow-xl text-xs font-bold text-white flex items-center gap-2.5">
            <span className="text-emerald-400 text-sm">✨</span>
            <span>Personalized AI Recommendation Feed</span>
          </div>
          <div className="rounded-2xl border border-white/20 bg-slate-900/70 backdrop-blur-xl px-4 py-2.5 shadow-xl text-xs font-bold text-white flex items-center gap-2.5">
            <span className="text-sky-400 text-sm">🛡️</span>
            <span>Real-Time Market Valuation & Deal Badges</span>
          </div>
        </div>

        <div className="absolute bottom-16 left-16 right-16 z-20">
          <div className="max-w-xl">
            <p className="text-white font-black text-3xl leading-snug drop-shadow-lg">
              “Join thousands of car buyers finding transparent, verified deals.”
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-1 w-12 bg-sky-500 rounded-full"></div>
              <span className="text-xs font-black text-sky-400 tracking-[0.2em] uppercase">
                VehicleWalay Auto Network
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
