import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';
import SearchBehaviorLogger from '@/components/SearchBehaviorLogger';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/apiBase';

export const dynamic = 'force-dynamic';

function pickParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined || v === '') return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function buildSearchHistoryLine(params: { [key: string]: string | string[] | undefined }): string {
  const q = pickParam(params.q);
  const make = pickParam(params.make);
  const city = pickParam(params.city);
  const minP = pickParam(params.min_price);
  const maxP = pickParam(params.max_price);
  const minY = pickParam(params.min_year);
  const maxY = pickParam(params.max_year);
  const parts: string[] = [];
  if (q) parts.push(`keyword ${q}`);
  if (make) parts.push(`make ${make}`);
  if (city) parts.push(`city ${city}`);
  if (minP || maxP) parts.push(`price ${minP ?? '?'}-${maxP ?? '?'}`);
  if (minY || maxY) parts.push(`year ${minY ?? '?'}-${maxY ?? '?'}`);
  if (parts.length === 0) return '';
  return `Search: ${parts.join(', ')}`.slice(0, 500);
}

async function getFilteredListings(searchParams: any) {
    const query = new URLSearchParams();
    if (searchParams.q) query.append('q', searchParams.q);
    if (searchParams.make) query.append('make', searchParams.make);
    if (searchParams.city) query.append('city', searchParams.city);
    if (searchParams.min_price) query.append('min_price', searchParams.min_price);
    if (searchParams.max_price) query.append('max_price', searchParams.max_price);
    if (searchParams.min_year) query.append('min_year', searchParams.min_year);
    if (searchParams.max_year) query.append('max_year', searchParams.max_year);
    if (searchParams.transmission) query.append('transmission', searchParams.transmission);
    if (searchParams.fuel_type) query.append('fuel_type', searchParams.fuel_type);
    if (searchParams.body_type) query.append('body_type', searchParams.body_type);

    const page = parseInt(searchParams.page as string || '1', 10);
    const limit = 50;
    const skip = (page - 1) * limit;

    query.append('skip', skip.toString());
    query.append('limit', limit.toString());

    const url = `${getApiBaseUrl()}/api/listings?${query.toString()}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('Error fetching filtered listings:', error);
        return [];
    }
}

export default async function SearchPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await props.searchParams;
    const page = parseInt(params.page as string || '1', 10);

    const searchResult = await getFilteredListings(params);
    const listings = Array.isArray(searchResult) ? searchResult : (searchResult.items || []);
    const totalCount = !Array.isArray(searchResult) && searchResult.total !== undefined ? searchResult.total : listings.length;
    const totalPages = Math.ceil(totalCount / 50);
    const historyLine = buildSearchHistoryLine(params);

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-20">
            <SearchBehaviorLogger line={historyLine} />
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                {/* Modern Filter Sidebar */}
                <div className="w-full md:w-[320px] flex-shrink-0">
                    <FilterSidebar currentParams={params} />
                </div>

                {/* Results Main Section */}
                <div className="flex-grow min-w-0">
                    {/* Header Banner */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200/90 bg-white p-6 shadow-sm">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Search</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Verified Used Cars
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-sky-50 border border-sky-200/60 px-4 py-1.5 text-xs font-black text-sky-800 shadow-xs">
                                {totalCount} {totalCount === 1 ? 'vehicle' : 'vehicles'} found
                            </span>
                        </div>
                    </div>

                    {listings.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200/90 shadow-xl shadow-slate-900/[0.02] flex flex-col items-center justify-center p-8">
                            <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner ring-1 ring-sky-100">
                                🔍
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No Vehicles Match Criteria</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto text-sm leading-relaxed">
                                We couldn't find vehicles matching all these filters. Try widening your price range or clearing some filters.
                            </p>
                            <Link
                                href="/search"
                                className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
                            >
                                Reset All Filters
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {listings.map((vehicle: any) => (
                                <ListingCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-10">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                searchParams={params}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
