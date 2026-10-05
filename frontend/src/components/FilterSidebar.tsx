'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export type ForYouFilterValues = {
  make: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  transmission: string;
  fuelType: string;
  bodyType: string;
  q: string;
};

type FilterSidebarProps = {
  currentParams?: Record<string, string | string[] | undefined> | undefined;
  mode?: 'search' | 'forYou';
  onApplyForYou?: (filters: ForYouFilterValues) => void;
};

export default function FilterSidebar({
  currentParams,
  mode = 'search',
  onApplyForYou,
}: FilterSidebarProps) {
    const router = useRouter();
    const [make, setMake] = useState((currentParams?.make as string) || '');
    const [city, setCity] = useState((currentParams?.city as string) || '');
    const [minPrice, setMinPrice] = useState((currentParams?.min_price as string) || '');
    const [maxPrice, setMaxPrice] = useState((currentParams?.max_price as string) || '');
    const [transmission, setTransmission] = useState((currentParams?.transmission as string) || '');
    const [fuelType, setFuelType] = useState((currentParams?.fuel_type as string) || '');
    const [bodyType, setBodyType] = useState((currentParams?.body_type as string) || '');
    const [q, setQ] = useState((currentParams?.q as string) || '');

    useEffect(() => {
        if (mode !== 'forYou') return;
        if (!currentParams) {
            setMake('');
            setCity('');
            setMinPrice('');
            setMaxPrice('');
            setTransmission('');
            setFuelType('');
            setBodyType('');
            setQ('');
            return;
        }
        setMake((currentParams.make as string) || '');
        setCity((currentParams.city as string) || '');
        setMinPrice((currentParams.min_price as string) || '');
        setMaxPrice((currentParams.max_price as string) || '');
        setTransmission((currentParams.transmission as string) || '');
        setFuelType((currentParams.fuel_type as string) || '');
        setBodyType((currentParams.body_type as string) || '');
        setQ((currentParams.q as string) || '');
    }, [mode, currentParams]);

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'forYou' && onApplyForYou) {
          onApplyForYou({ make, city, minPrice, maxPrice, transmission, fuelType, bodyType, q });
          return;
        }
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (make) params.append('make', make);
        if (city) params.append('city', city);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (transmission) params.append('transmission', transmission);
        if (fuelType) params.append('fuel_type', fuelType);
        if (bodyType) params.append('body_type', bodyType);

        router.push(`/search?${params.toString()}`);
    };

    const clearFilters = () => {
        setMake('');
        setCity('');
        setMinPrice('');
        setMaxPrice('');
        setTransmission('');
        setFuelType('');
        setBodyType('');
        setQ('');
        if (mode === 'forYou' && onApplyForYou) {
          onApplyForYou({ make: '', city: '', minPrice: '', maxPrice: '', transmission: '', fuelType: '', bodyType: '', q: '' });
          return;
        }
        router.push('/search');
    };

    const popularMakes = ['Toyota', 'Honda', 'Suzuki', 'KIA', 'Hyundai', 'Nissan', 'Changan', 'MG', 'Daihatsu', 'BMW', 'Mercedes'];
    const popularCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad', 'Multan'];
    const transmissions = ['Automatic', 'Manual'];
    const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'CNG', 'Electric'];
    const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'MPV', 'Van', 'Coupe', 'Truck'];

    const inputClass = "w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20";
    const selectClass = "w-full cursor-pointer appearance-none rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 transition-all focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20";

    return (
        <div className="sticky top-28 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/[0.03]">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-black">
                        ⚡
                    </span>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                        {mode === 'forYou' ? 'Refine For You' : 'Search Filters'}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-sky-600 transition-colors hover:bg-sky-50"
                >
                    Reset
                </button>
            </div>

            <form onSubmit={applyFilters} className="space-y-4">
                {/* Keywords */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Keyword</label>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="e.g. Civic, Sunroof, Turbo"
                        className={inputClass}
                    />
                </div>

                {/* Make */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Make</label>
                    <select value={make} onChange={(e) => setMake(e.target.value)} className={selectClass}>
                        <option value="">All Makes</option>
                        {popularMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                {/* City */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
                        <option value="">All Cities</option>
                        {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Transmission */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Transmission</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={selectClass}>
                        <option value="">All Transmissions</option>
                        {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Fuel Type */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Fuel Type</label>
                    <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={selectClass}>
                        <option value="">All Fuel Types</option>
                        {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                {/* Body Type */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Body Type</label>
                    <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={selectClass}>
                        <option value="">All Body Types</option>
                        {bodyTypes.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Min PKR</label>
                        <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="e.g. 1000000"
                            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs font-semibold focus:border-sky-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Max PKR</label>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="e.g. 6000000"
                            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs font-semibold focus:border-sky-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="shimmer-btn mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] hover:shadow-xl active:scale-95"
                >
                    <span>Apply Filters</span>
                    <span>→</span>
                </button>
            </form>
        </div>
    );
}
