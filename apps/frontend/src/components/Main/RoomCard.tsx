import React, { useState } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { handleImageError, getSafeImageUrl } from '../../utils/imageUtils';

export default function RoomCard({ property }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = property.images && currentIndex === property.images.length - 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (!isFirstSlide) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (!isLastSlide) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const numberOfNights = 2;
  const discountedTotalPrice = property.price * numberOfNights;
  const originalTotalPrice = Math.round(discountedTotalPrice * 1.15);

  return (
    <div
      className="cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(`/house/${property.id}`, '_blank')}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-200 mb-2">
        {property.house_rating >= 4.9 && (
          <span className="absolute left-3 top-3 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-20">
            Guest favorite
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Toggled favorite for property', property.id);
          }}
          className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center z-20"
        >
          <Heart
            className={`h-6 w-6 text-white transition-colors ${
              property.isFavorite ? 'fill-red-500' : 'fill-black/40'
            }`}
            stroke="white"
            strokeWidth={2}
          />
        </button>

        <div
          className="w-full h-full flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {property.images &&
            property.images.map((imgUrl, index) => (
              <img
                key={index}
                src={getSafeImageUrl(imgUrl)}
                alt={`${property.title} ${index + 1}`}
                className="w-full h-full object-cover flex-shrink-0"
                onError={(e) => {
                  handleImageError(
                    e.currentTarget,
                    property.title?.charAt(0)?.toUpperCase() || 'H',
                  );
                }}
              />
            ))}
        </div>

        {isHovered && property.images && property.images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={isFirstSlide}
              className={`absolute top-1/2 left-2 -translate-y-1/2 bg-white/90 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md z-20 transition-opacity ${
                isFirstSlide ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={isLastSlide}
              className={`absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md z-20 transition-opacity ${
                isLastSlide ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {property.images.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentIndex === i ? 'bg-white scale-125' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-4 left-4 z-10 w-14 h-16 [perspective:1000px]">
          <div className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ease-in-out">
            <div className="absolute w-full h-full bg-[#ededed] rounded-r-md shadow-lg"></div>

            <div
              className="absolute top-0 left-0 w-full h-full bg-[#ededed]
                         flex items-center justify-center
                         origin-left transition-transform duration-500 ease-in-out
                         border-l-2 border-slate-300
                         rounded-r-md
                         group-hover:[transform:rotateY(-45deg)] group-hover:shadow-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-inner border border-gray-200 overflow-hidden">
                {property.images && property.images[0] && (
                  <img
                    src={getSafeImageUrl(property.images[0])}
                    alt="House Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      handleImageError(e.currentTarget, 'H');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col text-sm">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 text-base line-clamp-1">{property.location}</h3>
          <div className="flex items-center space-x-1 text-gray-800 shrink-0 ml-2">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-normal">{property.rating.toFixed(2)}</span>
            <span className="text-gray-500">({property.reviews})</span>
          </div>
        </div>
        <p className="text-gray-500 line-clamp-1">{property.title}</p>
        <p className="text-gray-500">Sep 26 – 28</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-gray-500 line-through">₫{originalTotalPrice.toLocaleString()}</span>
          <span className="font-semibold text-gray-900 text-base">
            ₫{discountedTotalPrice.toLocaleString()}
          </span>
          <span className="text-gray-500">for {numberOfNights} nights</span>
        </div>
      </div>
    </div>
  );
}
