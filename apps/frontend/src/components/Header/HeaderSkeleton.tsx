import React from "react";
import icon from "../../asset/airbnb.svg";

const HeaderSkeleton = () => {
  return (
    <div className="fixed top-0 w-full bg-[#f9f9f9] border-b border-gray-200 z-50">
      <div className="w-full py-2 1xz:py-0 relative z-[99999] flex flex-col 1smd:items-center items-start justify-center">
        <div className="bg-gradient-to-b from-[#fcfcfc] to-[#f9f9f9] grid grid-cols-3 w-full 1xl:px-16 px-8">
          
          {/* Logo Section - Far Left */}
          <div className="min-w-[102px]">
            <a href="/">
              <div className="1xz:flex hidden h-20 items-center">
                <img className="w-[102px] h-[80px]" src={icon} alt="Airbnb Logo" />
              </div>
            </a>
          </div>

          {/* Center - Navigation Links with Circle + Text */}
          <div className="flex h-20 justify-center items-end">
            <nav className="hidden 1smd:flex items-center">
              <div className="flex items-center gap-2" role="tablist">
                {Array.from({ length: 3 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex items-center gap-0 px-2 py-2 transition-colors relative group"
                  >
                    <div className="relative flex items-center justify-center" style={{ width: '64px', height: '64px', marginRight: '-2px' }}>
                      <div className="w-6 h-6 animate-shimmer bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="relative inline-block">
                      <div className="w-16 h-3 animate-shimmer bg-gray-200 rounded"></div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Hamburger Menu - Far Right */}
          <div className="h-20 1xz:flex hidden items-center justify-end gap-1">
            <div className="ml-[0.75rem] relative inline-block">
              <button
                aria-label="User menu"
                aria-haspopup="menu"
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#e6e6e6] cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[22px] w-[22px] text-neutral-700"
                  aria-hidden
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Form - Positioned like original */}
        <div className="w-full bg-[#f9f9f9] pb-6">
          <div className="w-full 1smd:w-auto hidden 1xz:flex 1smd:block items-center justify-center">
            <div className="w-auto max-w-2xl h-16 bg-white rounded-full border border-gray-300 shadow-lg flex items-center pl-6 pr-3 mx-auto">
              <div className="flex-1 flex items-center space-x-6">
                <div className="w-20 h-4 animate-shimmer bg-gray-300 rounded"></div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="w-16 h-4 animate-shimmer bg-gray-300 rounded"></div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="w-24 h-4 animate-shimmer bg-gray-300 rounded"></div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="w-20 h-4 animate-shimmer bg-gray-300 rounded"></div>
              </div>
              <div className="ml-4 w-12 h-12 bg-[#FF385C] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderSkeleton;
