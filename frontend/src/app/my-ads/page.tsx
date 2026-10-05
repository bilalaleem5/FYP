"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { SkeletonGrid } from "@/components/SkeletonCard";

export default function MyAds() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/listings/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete ad");

      setAds(ads.filter((ad) => ad.id !== id));
      showToast("Listing deleted successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete ad", "error");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const fetchMyAds = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/listings/user/my-ads", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch ads");
        }

        const data = await res.json();
        setAds(data.items || []);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMyAds();
  }, [router]);

  const formatLakh = (price: number) => {
    if (!price) return "N/A";
    const lakh = price / 100000;
    return `PKR ${lakh >= 100 ? (price / 10000000).toFixed(2) + " Crore" : lakh.toFixed(1) + " Lakh"}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-3">
            <div className="h-10 w-52 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-5 w-80 rounded-xl bg-slate-100 animate-pulse" />
          </div>
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-700 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Seller Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              My Listed <span className="gradient-text-sky">Vehicles</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your active car ads, track inquiries, and inspect marketplace views.
            </p>
          </div>

          <Link
            href="/sell"
            className="shimmer-btn inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 hover:scale-[1.01] hover:shadow-lg transition-all"
          >
            <span>+ Post Another Vehicle</span>
            <span>🚗</span>
          </Link>
        </div>

        {/* Dashboard Quick Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-8">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Listings
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{ads.length}</span>
              <span className="text-xs font-semibold text-emerald-600">● Live on portal</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Visibility Status
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-sky-600">Public & Searchable</span>
              <span className="text-xs font-semibold text-slate-500">Across Pakistan</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Seller Trust
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600">Verified Member</span>
              <span className="text-xs font-semibold text-slate-500">🛡️ Direct Contact</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Listing Grid or Empty State */}
        {ads.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.03] p-12 sm:p-16 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl shadow-inner">
              🚘
            </div>
            <h3 className="text-2xl font-black text-slate-900">No Vehicles Listed Yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Ready to sell your car? Post your ad with photos and reach thousands of car buyers across Pakistan.
            </p>
            <div className="mt-8">
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-sky-500 hover:scale-105 transition-all"
              >
                <span>Post Your Ad in 2 Minutes</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-300"
              >
                {/* Image Banner */}
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  {ad.image_url ? (
                    <img
                      src={
                        ad.image_url.startsWith("http")
                          ? ad.image_url
                          : `http://localhost:8000${ad.image_url}`
                      }
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs font-bold">No Image Available</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="rounded-full bg-emerald-500/95 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 shadow-sm flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  <div className="absolute top-3.5 right-3.5">
                    <span className="rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-black px-3 py-1 border border-white/20">
                      {formatLakh(ad.price)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                    {ad.title}
                  </h3>

                  <div className="mt-2 text-2xl font-black text-slate-900">
                    PKR {ad.price ? Number(ad.price).toLocaleString() : "N/A"}
                  </div>

                  {/* Spec Pills */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      📅 {ad.model_year || "2022"}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      🛣️ {ad.mileage ? `${ad.mileage.toLocaleString()} km` : "N/A"}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 truncate max-w-[120px]">
                      📍 {ad.location || "Pakistan"}
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Listed {new Date(ad.created_at || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={deletingId === ad.id}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
                      >
                        {deletingId === ad.id ? "Deleting..." : "Delete"}
                      </button>

                      <Link
                        href={`/vehicle/${ad.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold hover:bg-sky-600 hover:text-white transition-all"
                      >
                        View Ad →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
