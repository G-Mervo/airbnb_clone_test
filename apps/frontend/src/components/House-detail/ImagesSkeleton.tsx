import React from "react";

// Image grid skeleton for desktop
const ImageGridSkeleton: React.FC = () => {
  const gridLayout = [
    "grid-area-image1",
    "grid-area-image2", 
    "grid-area-image3",
    "grid-area-image4",
    "grid-area-image5",
  ];

  return (
    <div className="max-w-7xl hidden 1xz:block w-full px-10 1lg:px-20">
      <div className="pt-6">
        <div className="grid-areas rounded-xl overflow-hidden">
          {gridLayout.map((gridArea, index) => (
            <div
              key={index}
              className={`${gridArea} bg-gray-200 animate-shimmer`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Image carousel skeleton for mobile
const ImageCarouselSkeleton: React.FC = () => (
  <div className="w-full h-full">
    <div className="w-full h-full flex overflow-x-auto">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            aspectRatio: "16/10",
            width: "100%",
            height: "100%",
          }}
          className="bg-gray-200 animate-shimmer"
        />
      ))}
    </div>
  </div>
);

// Mobile action bar skeleton
const ActionBarSkeleton: React.FC = () => (
  <div className="w-full px-3 flex items-center justify-between h-16">
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer" />
    <div className="space-x-2 items-center flex justify-between">
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer" />
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer" />
    </div>
  </div>
);

// Header section skeleton (title and actions)
const HeaderSkeleton: React.FC = () => (
  <div className="max-w-7xl w-full px-5 1xz:px-10 1lg:px-20 flex justify-between">
    <div>
      <div className="w-96 h-10 bg-gray-200 animate-shimmer rounded mt-6" />
    </div>
    <div className="pt-6 hidden 1xz:flex">
      <div className="w-40 h-8 bg-gray-200 animate-shimmer rounded" />
    </div>
  </div>
);

// Main images skeleton component - ONLY for images
const ImagesSkeleton: React.FC = () => (
  <div className="w-full">
    {/* Mobile view */}
    <div className="w-full 1xz:hidden">
      <ActionBarSkeleton />
      <div className="w-full min-h-80 h-full">
        <ImageCarouselSkeleton />
      </div>
    </div>

    {/* Desktop images and title - only what needs skeleton */}
    <div className="flex-center flex-col">
      <HeaderSkeleton />
      <ImageGridSkeleton />
    </div>
  </div>
);

export default ImagesSkeleton;