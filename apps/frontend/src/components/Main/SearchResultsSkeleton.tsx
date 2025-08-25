import React from 'react';

const SearchResultsSkeletonCard = () => {
  return (
    <div className="cursor-pointer group">
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-200 mb-2 animate-shimmer"></div>

      {/* Content Skeleton */}
      <div className="flex flex-col gap-1.5">
        {' '}
        <div className="w-4/5 h-4 bg-gray-200 rounded animate-shimmer"></div>
        <div className="w-3/5 h-3 bg-gray-200 rounded animate-shimmer"></div>
        <div className="w-2/5 h-3 bg-gray-200 rounded animate-shimmer"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-shimmer mt-1"></div>
      </div>
    </div>
  );
};

const SearchResultsSkeleton = ({ pageSize = 18 }: { pageSize?: number }) => {
  return (
    <div className="w-full py-6 pr-0 md:pr-0 lg:pr-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-1/4 h-4 bg-gray-200 rounded animate-shimmer"></div>
        <div className="w-1/3 h-4 bg-gray-200 rounded animate-shimmer"></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
        {Array.from({ length: pageSize }).map((_, index) => (
          <SearchResultsSkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default SearchResultsSkeleton;
