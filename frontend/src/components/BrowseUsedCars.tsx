"use client";

import { useState } from 'react';
import Link from 'next/link';

const tabs = ['Category', 'City', 'Make', 'Budget', 'Body Type'];

export default function BrowseUsedCars() {
    const [activeTab, setActiveTab] = useState('Category');

    const categories = [
        { 
            name: 'Automatic Cars', 
            desc: 'Effortless city drive', 
            link: '/search?transmission=Automatic',
            icon: (
                <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        { 
            name: 'Family Sedans', 
            desc: 'Comfort & space', 
            link: '/search?body_type=Sedan',
            icon: (
                <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                </svg>
            )
        },
        { 
            name: 'Luxury SUVs', 
            desc: 'Off-road & prestige', 
            link: '/search?body_type=SUV',
            icon: (
                <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16V9l3-4h8l3 4v7M2 16h20v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
                    <circle cx="7" cy="16" r="2" />
                    <circle cx="17" cy="16" r="2" />
                </svg>
            )
        },
        { 
            name: 'Hybrid & EV', 
            desc: 'Max fuel efficiency', 
            link: '/search?fuel_type=Hybrid',
            icon: (
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    <circle cx="12" cy="12" r="9" />
                </svg>
            )
        },
        { 
            name: 'Japanese Imports', 
            desc: 'Quality inspected', 
            link: '/search?q=Japanese',
            icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
            )
        },
        { 
            name: 'Budget Hatchbacks', 
            desc: 'Economical commuters', 
            link: '/search?body_type=Hatchback',
            icon: (
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    const cities = [
        { name: 'Lahore', count: '5,000+ ads' },
        { name: 'Karachi', count: '4,500+ ads' },
        { name: 'Islamabad', count: '3,200+ ads' },
        { name: 'Rawalpindi', count: '2,800+ ads' },
        { name: 'Faisalabad', count: '1,400+ ads' },
        { name: 'Peshawar', count: '1,100+ ads' },
        { name: 'Multan', count: '900+ ads' },
        { name: 'Gujranwala', count: '850+ ads' },
        { name: 'Sialkot', count: '700+ ads' },
        { name: 'Hyderabad', count: '650+ ads' },
        { name: 'Quetta', count: '500+ ads' },
        { name: 'Abbottabad', count: '450+ ads' },
    ];

    const makes = [
        { name: 'Toyota', code: 'TOY', tag: 'Top Reliability' },
        { name: 'Honda', code: 'HON', tag: 'Driving Pleasure' },
        { name: 'Suzuki', code: 'SUZ', tag: 'Fuel Saver' },
        { name: 'KIA', code: 'KIA', tag: 'Modern Tech' },
        { name: 'Hyundai', code: 'HYU', tag: 'Premium Comfort' },
        { name: 'Changan', code: 'CHN', tag: 'Best Value' },
        { name: 'MG', code: 'MG', tag: 'British Heritage' },
        { name: 'Haval', code: 'HVL', tag: 'Smart Hybrid' },
        { name: 'Mercedes', code: 'MBZ', tag: 'Luxury Tier' },
        { name: 'BMW', code: 'BMW', tag: 'Performance' },
        { name: 'Audi', code: 'AUD', tag: 'Prestige' },
        { name: 'Nissan', code: 'NIS', tag: 'Everyday Power' },
    ];

    const budgets = [
        { label: 'Under 15 Lakh', sub: 'Starter & daily cars', link: '/search?max_price=1500000' },
        { label: '15 – 30 Lakh', sub: 'Hatchbacks & clean sedans', link: '/search?min_price=1500000&max_price=3000000' },
        { label: '30 – 50 Lakh', sub: 'Mid-range Civics & Corollas', link: '/search?min_price=3000000&max_price=5000000' },
        { label: '50 – 80 Lakh', sub: 'Crossovers & late model sedans', link: '/search?min_price=5000000&max_price=8000000' },
        { label: '80 Lakh – 1.5 Crore', sub: 'Sportage, Fortuner & luxury', link: '/search?min_price=8000000&max_price=15000000' },
        { label: 'Above 1.5 Crore', sub: 'Prado, Land Cruiser & EV', link: '/search?min_price=15000000' },
    ];

    const bodyTypes = [
        { type: 'Sedan', desc: 'Corolla, Civic, City' },
        { type: 'SUV', desc: 'Fortuner, Sportage, Tucson' },
        { type: 'Hatchback', desc: 'Alto, Cultus, Swift' },
        { type: 'Crossover', desc: 'Vezel, Stonic, HR-V' },
        { type: 'MPV / Van', desc: 'Bolan, APV, BR-V' },
        { type: '4x4 Offroad', desc: 'Prado, Hilux, Jimny' },
    ];

    return (
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.03] sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-7">
                <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Quick Directory</span>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        Explore Used Cars in Pakistan
                    </h2>
                </div>

                {/* Animated Segmented Tabs */}
                <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100/90 p-1.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                                activeTab === tab
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-8">
                {activeTab === 'Category' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.name}
                                href={cat.link}
                                className="card-motion group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 transition-all hover:border-sky-300 hover:bg-white"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-transform group-hover:scale-110">
                                    {cat.icon}
                                </span>
                                <div className="mt-4">
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600">{cat.name}</h3>
                                    <p className="mt-1 text-[11px] font-medium text-slate-400">{cat.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {activeTab === 'City' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {cities.map((city) => (
                            <Link
                                key={city.name}
                                href={`/search?city=${city.name}`}
                                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3.5 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-md"
                            >
                                <span className="text-sm font-bold text-slate-800 group-hover:text-sky-600">{city.name}</span>
                                <span className="mt-0.5 text-[11px] font-semibold text-sky-600">{city.count}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {activeTab === 'Make' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                        {makes.map((m) => (
                            <Link
                                key={m.name}
                                href={`/search?make=${m.name}`}
                                className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-md"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-xs font-black text-white shadow-sm ring-1 ring-slate-800">
                                    {m.code}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900 group-hover:text-sky-600">{m.name}</p>
                                    <p className="truncate text-[10px] font-semibold text-slate-400">{m.tag}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {activeTab === 'Budget' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgets.map((b) => (
                            <Link
                                key={b.label}
                                href={b.link}
                                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-md"
                            >
                                <div>
                                    <span className="text-base font-black text-slate-900 group-hover:text-sky-600">{b.label}</span>
                                    <p className="mt-1 text-xs font-medium text-slate-500">{b.sub}</p>
                                </div>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-400 shadow-sm transition-transform group-hover:translate-x-1 group-hover:text-sky-600">
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                )}

                {activeTab === 'Body Type' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {bodyTypes.map((t) => (
                            <Link
                                key={t.type}
                                href={`/search?body_type=${t.type}`}
                                className="card-motion group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 transition-all hover:border-sky-300 hover:bg-white"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                                    <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                                        <circle cx="7" cy="17" r="2" />
                                        <path d="M9 17h6" />
                                        <circle cx="17" cy="17" r="2" />
                                    </svg>
                                </span>
                                <div className="mt-4">
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600">{t.type}</h3>
                                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{t.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
