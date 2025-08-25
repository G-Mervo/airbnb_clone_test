import React from 'react';
import { Search, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import houseIcon from '../../asset/house.png';

const MinimizedSearchFormSkeleton = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-md h-12 animate-pulse">
        <div className="flex items-center pl-2 pr-4 h-full">
          <img
            src={houseIcon}
            alt="Homes"
            className="w-[48px] h-[48px] mr-2 filter grayscale opacity-50"
          />
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="flex items-center px-4 h-full">
          <div className="w-28 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="flex items-center pl-4 pr-12 h-full relative">
          <div className="w-24 h-4 bg-gray-200 rounded mr-2"></div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="flex items-center justify-center w-9 h-9 bg-gray-300 text-white rounded-full">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterModalSkeleton = () => {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl animate-pulse">
      <div className="w-5 h-5 bg-gray-200 rounded"></div>
      <div className="w-16 h-4 bg-gray-200 rounded"></div>
    </div>
  );
};

const MobileSearchHeaderSkeleton = () => {
  return (
    <div className="w-full flex items-center justify-between animate-pulse">
      <div className="sm:hidden">
        <ArrowLeft size={20} className="text-gray-300" />
      </div>
      <div className="hidden sm:block w-[102px] h-[32px] bg-gray-200 rounded-md"></div>

      <div className="flex-grow sm:flex-grow-0 sm:w-auto mx-4 h-12 bg-gray-200 border border-gray-200 rounded-full"></div>

      <div className="w-10 h-10 bg-gray-200 border border-gray-200 rounded-full"></div>
    </div>
  );
};

const SearchPageHeaderSkeleton = ({ isMobile = false }) => {
  if (isMobile) {
    return <MobileSearchHeaderSkeleton />;
  }

  return (
    <div className="flex items-center justify-center h-20 space-x-4">
      <MinimizedSearchFormSkeleton />
      <FilterModalSkeleton />
    </div>
  );
};

export default SearchPageHeaderSkeleton;
