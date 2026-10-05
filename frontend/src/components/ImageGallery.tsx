"use client";

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
    images: string[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="relative h-96 w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 font-medium">No Image Available</span>
            </div>
        );
    }

    const goToPrevious = () => {
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLast = currentIndex === images.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Main Featured Image Container */}
            <div className="relative h-[350px] sm:h-[450px] md:h-[550px] w-full rounded-xl overflow-hidden bg-black group shadow-sm border border-gray-100">
                <Image
                    src={images[currentIndex]}
                    alt={`${title} - Image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    unoptimized={images[currentIndex].includes('pakwheels')}
                    priority
                />

                {images.length > 1 && (
                    <>
                        {/* Navigation Arrows */}
                        <div
                            onClick={goToPrevious}
                            className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center cursor-pointer transition-all z-10 backdrop-blur-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </div>
                        <div
                            onClick={goToNext}
                            className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center cursor-pointer transition-all z-10 backdrop-blur-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>

                        {/* Image Counter Badge */}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {/* Scrollable Thumbnails Strip */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {images.map((imgUrl, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative h-20 w-28 xs:w-32 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-[3px] transition-all duration-200 ${currentIndex === idx
                                    ? 'border-blue-600 opacity-100 scale-100 shadow-md'
                                    : 'border-transparent opacity-60 hover:opacity-100 scale-95 hover:scale-100'
                                }`}
                        >
                            <Image
                                src={imgUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized={imgUrl.includes('pakwheels')}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
