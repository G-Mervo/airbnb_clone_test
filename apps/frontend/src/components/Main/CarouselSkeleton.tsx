import React from "react";

const CarouselSkeleton = ({ title }: { title?: string }) => {
  return (
    <section className="w-full pt-8 pb-1">
      <div className="flex items-center justify-between mb-3 pl-2 pr-2">
        <div className="flex items-center gap-2">
          <div className="w-32 h-6 animate-shimmer bg-gray-200 rounded"></div>
          <div className="w-4 h-4 animate-shimmer bg-gray-200 rounded"></div>
        </div>
        <div className="hidden 1sm:flex items-center gap-2">
          <div className="w-8 h-8 animate-shimmer bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 animate-shimmer bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Grid layout to match exact spacing */}
      <div className="grid grid-cols-6 gap-6 pl-2 pr-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    </section>
  );
};

const SkeletonCard = () => {
  return (
    <div className="space-y-3">
      <div className="w-full aspect-square animate-shimmer bg-gray-200 rounded-lg"></div>
      <div className="space-y-2">
        <div className="w-3/4 h-4 animate-shimmer bg-gray-200 rounded"></div>
        <div className="w-1/2 h-3 animate-shimmer bg-gray-200 rounded"></div>
        <div className="w-2/3 h-3 animate-shimmer bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default CarouselSkeleton;
