'use client';

/** Skeleton placeholder card that mimics ListingCard's shape. */
export default function SkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[5/4] w-full bg-slate-200/70" />

      {/* Content */}
      <div className="flex flex-grow flex-col p-4 sm:p-5">
        {/* Title lines */}
        <div className="h-4 w-[85%] rounded-md bg-slate-200/80" />
        <div className="mt-2 h-4 w-[60%] rounded-md bg-slate-200/60" />

        {/* Price label */}
        <div className="mt-3 h-3 w-16 rounded bg-slate-200/50" />
        {/* Price */}
        <div className="mt-1.5 h-6 w-36 rounded-md bg-slate-200/80" />

        {/* Location */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded-full bg-slate-200/60" />
          <div className="h-3 w-24 rounded bg-slate-200/60" />
        </div>
      </div>

      {/* Bottom stats */}
      <div className="mt-auto grid grid-cols-3 gap-px bg-slate-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center bg-slate-50/90 px-1 py-3 gap-1.5">
            <div className="h-2.5 w-10 rounded bg-slate-200/50" />
            <div className="h-3 w-14 rounded bg-slate-200/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid of skeleton cards for loading states. */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
