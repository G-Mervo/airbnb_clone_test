import React from 'react';
import HeaderSkeleton from '../Header/HeaderSkeleton';

const SkeletonCard = () => {
  return (
    <div className="space-y-3">
      <div className="w-full aspect-square animate-shimmer bg-gray-200 rounded-xl"></div>
      <div className="space-y-2">
        <div className="w-full h-4 animate-shimmer bg-gray-200 rounded"></div>
        <div className="w-3/4 h-3 animate-shimmer bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

const CarouselSectionSkeleton = ({ count = 7 }: { count?: number }) => {
  return (
    <section className="w-full mb-12">
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="h-6 w-48 animate-shimmer bg-gray-200 rounded"></div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 animate-shimmer bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 animate-shimmer bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="flex overflow-hidden -mx-3">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-1 min-w-0 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-[calc(100%/7)]"
            >
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingPageSkeleton = () => {
  return (
    <div className="w-full min-h-screen bg-white">
      <HeaderSkeleton />

      <main className="pt-56 pb-10">
        <CarouselSectionSkeleton />
        <CarouselSectionSkeleton />
      </main>
    </div>
  );
};

export default LandingPageSkeleton;
