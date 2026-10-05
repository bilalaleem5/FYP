"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';

interface VehicleProps {
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
    fake_score?: number;
}

export default function ListingCard({ vehicle }: { vehicle: VehicleProps }) {
    const [isSaved, setIsSaved] = useState(false);
    const [saveId, setSaveId] = useState<number | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    const { user, token } = useAuth();
    const { showToast } = useToast();

    // Check if vehicle is already saved on mount
    useEffect(() => {
        async function checkSavedStatus() {
            if (!user || !token) return;
            try {
                const res = await fetch(`${getClientApiBaseUrl()}/api/saved-vehicles/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const savedList = await res.json();
                    const savedRecord = savedList.find((sv: any) => sv.vehicle_id === vehicle.id);
                    if (savedRecord) {
                        setIsSaved(true);
                        setSaveId(savedRecord.id);
                    }
                }
            } catch (error) {
                console.error('Error checking saved status:', error);
            }
        }
        checkSavedStatus();
    }, [vehicle.id, user, token]);

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || !token) {
            setShowLoginModal(true);
            return;
        }

        try {
            if (isSaved && saveId) {
                const res = await fetch(`${getClientApiBaseUrl()}/api/saved-vehicles/${saveId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsSaved(false);
                    setSaveId(null);
                    showToast('Removed from saved list', 'info');
                } else {
                    showToast('Failed to remove from saved', 'error');
                }
            } else {
                const res = await fetch(`${getClientApiBaseUrl()}/api/saved-vehicles`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ user_id: 0, vehicle_id: vehicle.id }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsSaved(true);
                    setSaveId(data.id);
                    showToast('Vehicle saved to garage! ❤️', 'success');
                } else {
                    showToast('Failed to save vehicle', 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
            showToast('Network error — please retry', 'error');
        }
    };

    // Format price in Lakh for quick readability + exact PKR formatted
    const priceNum = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(vehicle.price || 0);
    const lakhValue = vehicle.price ? (vehicle.price / 100000).toFixed(1) : '0';
    const formattedPrice = `PKR ${priceNum}`;
    const lakhBadge = Number(lakhValue) >= 100 
      ? `PKR ${(vehicle.price / 10000000).toFixed(2)} Crore`
      : `PKR ${lakhValue} Lakh`;

    const isVerified = !vehicle.fake_score || vehicle.fake_score < 0.35;
    const displayImage = vehicle.image_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=1000';

    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-300/80 hover:shadow-[0_20px_40px_rgba(14,165,233,0.12)]">
            <Link href={`/vehicle/${vehicle.id}`} className="flex h-full flex-col">
                {/* Image Container with Dynamic Glass Badges */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100">
                    <Image
                        src={displayImage}
                        alt={vehicle.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        unoptimized={displayImage.includes('pakwheels')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md ring-1 ring-white/20">
                            {vehicle.model_year || 'N/A'}
                        </span>

                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${
                            isVerified 
                              ? 'bg-emerald-500/85 text-white ring-1 ring-emerald-300/40' 
                              : 'bg-amber-500/85 text-white ring-1 ring-amber-300/40'
                        }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            {isVerified ? 'Verified' : 'Review'}
                        </span>
                    </div>

                    {/* Quick Price Tag Overlay on Image */}
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                        <p className="text-lg font-black text-white drop-shadow-md sm:text-xl">
                            {lakhBadge}
                        </p>
                    </div>

                    {/* Floating Save Button */}
                    <button
                        onClick={handleSaveToggle}
                        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md ring-1 ring-white/50 transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95"
                        title={isSaved ? 'Remove from saved' : 'Save vehicle'}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isSaved ? '#ef4444' : 'none'}
                            stroke={isSaved ? '#ef4444' : '#64748b'}
                            className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>

                {/* Card Content */}
                <div className="flex flex-grow flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-sky-600 sm:text-[1.05rem]">
                        {vehicle.title}
                    </h3>
                    
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Total Price</span>
                        <span className="text-xs font-bold text-slate-600 tabular-nums">{formattedPrice}</span>
                    </div>

                    {/* Location Pin */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <svg className="h-4 w-4 shrink-0 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{vehicle.location || 'Pakistan'}</span>
                    </div>

                    {/* Specification Badges Row */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center transition-colors group-hover:bg-sky-50/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gear</p>
                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800">{vehicle.transmission || 'Auto'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center transition-colors group-hover:bg-sky-50/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fuel</p>
                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800">{vehicle.fuel_type || 'Petrol'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center transition-colors group-hover:bg-sky-50/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mileage</p>
                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800 tabular-nums">
                                {new Intl.NumberFormat('en-US').format(vehicle.mileage || 0)} km
                            </p>
                        </div>
                    </div>

                    {/* Action Arrow Footer */}
                    <div className="mt-4 flex items-center justify-between pt-1 text-xs font-bold text-sky-600 transition-colors group-hover:text-sky-700">
                        <span>View Vehicle Insights</span>
                        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                            →
                        </span>
                    </div>
                </div>
            </Link>

            {/* Login Prompt Modal */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    role="presentation"
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl animate-[slideUp_0.2s_ease-out]"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl ring-1 ring-rose-200/60">
                            ❤️
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Sign in to save</h3>
                        <p className="mt-2 text-sm font-medium text-slate-500">Create your private garage and track price drops on saved cars.</p>

                        <div className="mt-6 flex flex-col gap-2">
                            <Link
                                href="/login"
                                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 shadow-md"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Sign In
                            </Link>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowLoginModal(false);
                                }}
                                className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
