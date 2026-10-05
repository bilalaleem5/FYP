import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import SaveVehicleButton from '@/components/SaveVehicleButton';
import VehicleViewLogger from '@/components/VehicleViewLogger';
import MarketAnalysis from '@/components/MarketAnalysis';
import { getApiBaseUrl } from '@/lib/apiBase';

export const dynamic = 'force-dynamic';

async function getVehicleDetails(id: string) {
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/listings/${id}`, {
            cache: 'no-store',
        });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch data');
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching vehicle details:', error);
        return null;
    }
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const vehicle = await getVehicleDetails(resolvedParams.id);

    if (!vehicle) {
        notFound();
    }

    const priceNum = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(vehicle.price || 0);
    const formattedPrice = `PKR ${priceNum}`;
    const lakhValue = vehicle.price ? (vehicle.price / 100000).toFixed(1) : '0';
    const lakhBadge = Number(lakhValue) >= 100 
      ? `PKR ${(vehicle.price / 10000000).toFixed(2)} Crore`
      : `PKR ${lakhValue} Lakh`;

    let images = [];
    if (vehicle.extra_images && vehicle.extra_images.length > 0) {
        images = vehicle.extra_images;
    } else if (vehicle.image_url) {
        images = [vehicle.image_url];
    } else {
        images = ['https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=1000'];
    }

    const isPakwheels = vehicle.source_url && vehicle.source_url.includes('pakwheels');

    const viewSummary = [
        'Viewed listing:',
        [vehicle.make, vehicle.model, vehicle.model_year].filter(Boolean).join(' '),
        vehicle.location ? `in ${vehicle.location}` : '',
        vehicle.title ? `— ${String(vehicle.title).slice(0, 220)}` : '',
    ]
        .filter(Boolean)
        .join(' ')
        .slice(0, 500);

    return (
        <main className="min-h-screen bg-[#f8fafc] pb-24">
            <VehicleViewLogger vehicleId={vehicle.id} summaryLine={viewSummary} />
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back to Search Breadcrumb */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-sky-600"
                    >
                        <span>←</span>
                        <span>Back to Search Results</span>
                    </Link>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Ad ID: #{vehicle.id}
                    </span>
                </div>

                {/* Top Vehicle Hero Header Banner */}
                <div className="mb-8 rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.03] sm:p-9">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-black text-sky-800">
                                    {vehicle.model_year || 'Verified Model'}
                                </span>
                                {vehicle.registered_city && (
                                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                        Registered in {vehicle.registered_city}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                                {vehicle.title}
                            </h1>
                            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <span>📍 {vehicle.location || 'Pakistan'}</span>
                                <span>•</span>
                                <span>Updated recently</span>
                            </p>
                        </div>

                        {/* Price & Primary Call to Action */}
                        <div className="flex flex-col md:items-end gap-2.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                                    {lakhBadge}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">Total: {formattedPrice}</span>

                            <div className="flex flex-wrap gap-2.5 mt-2">
                                <SaveVehicleButton vehicleId={vehicle.id} />
                                {vehicle.source_url && (
                                    <a
                                        href={vehicle.source_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-black text-white shadow-sm transition hover:opacity-90 ${
                                            isPakwheels ? 'bg-blue-600' : 'bg-slate-900'
                                        }`}
                                    >
                                        <span>Original Ad on {isPakwheels ? 'PakWheels' : 'Source'}</span>
                                        <span>↗</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area (Gallery + Core Specs + Description) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Interactive Image Gallery Component */}
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white p-4 shadow-xl shadow-slate-900/[0.03]">
                            <ImageGallery images={images} title={vehicle.title} />
                        </div>

                        {/* Core Specification Cards (4 key metrics) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Model Year', val: vehicle.model_year || 'N/A', icon: '📅', color: 'text-sky-600 bg-sky-50' },
                                { label: 'Mileage', val: `${new Intl.NumberFormat('en-US').format(vehicle.mileage || 0)} km`, icon: '🛣️', color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Transmission', val: vehicle.transmission || 'Automatic', icon: '⚙️', color: 'text-indigo-600 bg-indigo-50' },
                                { label: 'Fuel Type', val: vehicle.fuel_type || 'Petrol', icon: '⛽', color: 'text-amber-600 bg-amber-50' },
                            ].map((spec) => (
                                <div key={spec.label} className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl mb-2 ${spec.color}`}>
                                        {spec.icon}
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{spec.label}</span>
                                    <span className="mt-1 truncate max-w-full text-base font-black text-slate-900">{spec.val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Secondary Specifications Details */}
                        <div className="rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.03]">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-5 flex items-center gap-2">
                                <span>📋</span>
                                <span>Detailed Vehicle Specifications</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm divide-y sm:divide-y-0 divide-slate-100">
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Registered City</span>
                                    <span className="font-bold text-slate-900">{vehicle.registered_city || vehicle.location || 'Un-registered'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Color</span>
                                    <span className="font-bold text-slate-900">{vehicle.color || 'Standard'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Assembly</span>
                                    <span className="font-bold text-slate-900">{vehicle.assembly || 'Local'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Engine Capacity</span>
                                    <span className="font-bold text-slate-900">{vehicle.engine_capacity ? `${vehicle.engine_capacity} cc` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Body Type</span>
                                    <span className="font-bold text-slate-900">{vehicle.body_type || 'Sedan'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-500">Currency</span>
                                    <span className="font-bold text-slate-900">{vehicle.currency || 'PKR'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Features Tags Cloud */}
                        {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
                            <div className="rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.03]">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                                    <span>✨</span>
                                    <span>Car Features & Equipment</span>
                                </h2>
                                <div className="flex flex-wrap gap-2.5">
                                    {vehicle.features.map((feature: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/80 px-3.5 py-1.5 text-xs font-bold text-sky-800"
                                        >
                                            <span className="text-emerald-500 font-black">✓</span>
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller's Comments / Description */}
                        <div className="rounded-[2rem] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.03]">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                                <span>💬</span>
                                <span>Seller's Description</span>
                            </h2>
                            <div className="rounded-2xl bg-slate-50/80 p-5 text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-line border border-slate-100">
                                {vehicle.description && vehicle.description.trim()
                                    ? vehicle.description
                                    : 'No additional comments provided by the seller.'}
                            </div>
                            <p className="mt-4 text-xs font-semibold text-slate-400">
                                Tip: Mention VehicleWalay when calling the seller for verified transparency.
                            </p>
                        </div>
                    </div>

                    {/* Right Sticky Sidebar (Market Analysis + Seller Card) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* High-Tech Market Analysis Component */}
                        <MarketAnalysis vehicleId={vehicle.id} />

                        {/* Seller Contact Card */}
                        <div className="sticky top-28 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.03]">
                            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-center">
                                <h3 className="text-base font-black text-slate-900">Seller Information</h3>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-2xl font-black text-white shadow-md shadow-sky-500/20">
                                        {(vehicle.owner_name && vehicle.owner_name[0]?.toUpperCase()) || '👤'}
                                    </div>
                                    <p className="text-lg font-black text-slate-900 text-center">
                                        {vehicle.owner_name || 'Marketplace Seller'}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Verified Owner
                                    </div>
                                </div>

                                {vehicle.owner_contact && vehicle.owner_contact.trim() !== '' ? (
                                    <div className="mb-4">
                                        <a
                                            href={`tel:${vehicle.owner_contact}`}
                                            className="shimmer-btn flex items-center justify-center gap-2.5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 px-4 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] hover:shadow-xl text-base"
                                        >
                                            <span>📞</span>
                                            <span>{vehicle.owner_contact}</span>
                                        </a>
                                        <p className="text-xs font-semibold text-center text-slate-400 mt-2">
                                            Tap to call seller directly
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center">
                                        <p className="text-xs font-bold text-slate-500 mb-2">Phone number masked for privacy</p>
                                        <a
                                            href={vehicle.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-black text-sky-600 hover:underline"
                                        >
                                            View original listing to reveal ↗
                                        </a>
                                    </div>
                                )}

                                {/* Safety Checklist */}
                                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-950 mb-2 flex items-center gap-1.5">
                                        <span>🛡️</span> Buyer Safety Guidelines
                                    </h4>
                                    <ul className="text-xs font-medium text-slate-600 space-y-1.5 list-disc pl-4">
                                        <li>Inspect vehicle physically before sending payment</li>
                                        <li>Verify engine number and chassis documentation</li>
                                        <li>Meet seller in a safe, public daylight location</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
