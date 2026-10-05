"use client";

import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getClientApiBaseUrl } from '@/lib/apiBase';

export default function SavedVehiclesPage() {
    const { user, token, loading } = useAuth();
    const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        async function fetchSaved() {
            if (!user || !token) {
                setIsFetching(false);
                return;
            }
            try {
                const res = await fetch(`${getClientApiBaseUrl()}/api/saved-vehicles/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSavedVehicles(data.map((record: any) => record.vehicle).filter(Boolean));
                }
            } catch (error) {
                console.error('Error fetching saved vehicles:', error);
            } finally {
                setIsFetching(false);
            }
        }
        
        if (!loading) {
            fetchSaved();
        }
    }, [user, token, loading]);

    if (loading || isFetching) {
        return (
            <main className="min-h-screen bg-[#f8fafc] py-10">
                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="h-9 w-64 rounded-2xl bg-slate-200 animate-pulse" />
                        <div className="h-4 w-96 rounded-lg bg-slate-100 animate-pulse mt-2" />
                    </div>
                    <SkeletonGrid count={8} />
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-900/[0.04] border border-slate-200/90 p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-100">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
                    <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
                        Sign in to access your personal garage, monitor price changes, and manage your shortlisted vehicles.
                    </p>
                    <Link
                        href="/login"
                        className="shimmer-btn block w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-sky-500/25 transition hover:scale-[1.01]"
                    >
                        Sign In Now
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8fafc] flex flex-col pb-20">
            <div className="flex-grow max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Banner */}
                <div className="mb-8 rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Shortlist</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Saved Garage
                            </h1>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Monitor your bookmarked vehicles, compare deals, and track seller updates.
                            </p>
                        </div>
                        <span className="rounded-full bg-rose-50 border border-rose-200/60 px-4 py-1.5 text-xs font-black text-rose-700 shadow-xs">
                            {savedVehicles.length} {savedVehicles.length === 1 ? 'vehicle' : 'vehicles'} bookmarked
                        </span>
                    </div>
                </div>

                {/* Saved Vehicles Grid */}
                {savedVehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200/90 shadow-xl shadow-slate-900/[0.02] flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-4 ring-1 ring-rose-100 shadow-inner">
                            ❤️
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Your Garage is Empty</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm font-medium leading-relaxed">
                            Click the heart icon on any vehicle card across the marketplace to bookmark it here for quick comparison.
                        </p>
                        <Link
                            href="/search"
                            className="rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
                        >
                            Explore Available Cars →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {savedVehicles.map((vehicle: any) => (
                            <ListingCard key={vehicle.id} vehicle={vehicle} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
