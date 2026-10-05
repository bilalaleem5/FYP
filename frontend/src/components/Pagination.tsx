import Link from 'next/link';

export default function Pagination({
    currentPage,
    totalPages,
    searchParams,
}: {
    currentPage: number;
    totalPages: number;
    searchParams: Record<string, string | string[] | undefined>;
}) {
    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
            // Don't duplicate page logic if it exists in searchParams
            if (key === 'page') return;

            if (value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else {
                    params.append(key, value);
                }
            }
        });
        params.set('page', pageNumber.toString());
        return `/search?${params.toString()}`;
    };

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center space-x-2 mt-12 mb-8">
            <Link
                href={createPageURL(currentPage - 1)}
                className={`px-4 py-2 flex items-center justify-center rounded-xl font-medium transition-colors border ${currentPage <= 1
                        ? 'text-gray-400 border-gray-100 bg-gray-50 pointer-events-none'
                        : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-[#2d9fd3]'
                    }`}
            >
                Previous
            </Link>

            <div className="hidden sm:flex items-center space-x-2">
                {startPage > 1 && (
                    <>
                        <Link
                            href={createPageURL(1)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-colors border ${currentPage === 1
                                    ? 'bg-[#2d9fd3] text-white border-[#2d9fd3] shadow-md shadow-[#2d9fd3]/20'
                                    : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 hover:text-[#2d9fd3]'
                                }`}
                        >
                            1
                        </Link>
                        {startPage > 2 && <span className="text-gray-400 px-2 font-medium">...</span>}
                    </>
                )}

                {pages.map((page) => (
                    <Link
                        key={page}
                        href={createPageURL(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-colors border ${currentPage === page
                                ? 'bg-[#2d9fd3] text-white border-[#2d9fd3] shadow-md shadow-[#2d9fd3]/20'
                                : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 hover:text-[#2d9fd3]'
                            }`}
                    >
                        {page}
                    </Link>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="text-gray-400 px-2 font-medium">...</span>}
                        <Link
                            href={createPageURL(totalPages)}
                            className={`w-10 h-10 min-w-10 flex px-2 items-center justify-center rounded-xl font-medium transition-colors border ${currentPage === totalPages
                                    ? 'bg-[#2d9fd3] text-white border-[#2d9fd3] shadow-md shadow-[#2d9fd3]/20'
                                    : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 hover:text-[#2d9fd3]'
                                }`}
                        >
                            {totalPages}
                        </Link>
                    </>
                )}
            </div>

            <Link
                href={createPageURL(currentPage + 1)}
                className={`px-4 py-2 flex items-center justify-center rounded-xl font-medium transition-colors border ${currentPage >= totalPages
                        ? 'text-gray-400 border-gray-100 bg-gray-50 pointer-events-none'
                        : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-[#2d9fd3]'
                    }`}
            >
                Next
            </Link>
        </div>
    );
}
