import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ListingCard from './ListingCard';
import { Room as PropertyDetail } from '../../api/apiRooms';
import { clearAllFilters, applyPresetFilter } from '../../redux/filterSlice';
import { clearSearchInputs, setDestinationInputVal } from '../../redux/mainFormSlice';
import { setHitSearch } from '../../redux/AppSlice';

interface CarouselSectionProps {
  title: string;
  items: PropertyDetail[];
  filterType?: 'category' | 'propertyType' | 'city';
  filterValue?: string;
}

function CarouselSection({ title, items, filterType, filterValue }: CarouselSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleTitleClick = () => {
    if (!filterType || !filterValue || filterValue === 'all') {
      return;
    }
    dispatch(clearAllFilters());
    dispatch(clearSearchInputs());
    if (filterType === 'city') {
      // Set the destination input value
      dispatch(setDestinationInputVal(filterValue));
      // Trigger the search by incrementing hitSearch counter
      dispatch(setHitSearch(Date.now())); // Use timestamp to ensure unique value
      // Navigate to search results
      navigate('/search');
    } else {
      dispatch(applyPresetFilter({ filterType, filterValue }));
      // Trigger the search for other filter types
      dispatch(setHitSearch(Date.now()));
      navigate('/search');
    }
  };

  const checkScrollPosition = () => {
    const node = containerRef.current;
    if (!node) return;
    const scrollLeft = node.scrollLeft;
    const scrollWidth = node.scrollWidth;
    const clientWidth = node.clientWidth;

    // If content doesn't overflow, disable both buttons
    if (scrollWidth <= clientWidth) {
      setIsAtStart(true);
      setIsAtEnd(true);
      return;
    }
    setIsAtStart(scrollLeft <= 1);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const checkWithDelay = () => setTimeout(checkScrollPosition, 100);
    checkWithDelay();
    node.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkWithDelay);
    return () => {
      node.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkWithDelay);
    };
  }, [items]);

  const scrollContainer = (direction: 'left' | 'right') => {
    const node = containerRef.current;
    if (!node) return;
    const scrollAmount = node.clientWidth;
    node.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-12">
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleTitleClick}
              className="text-xl leading-6 font-semibold text-gray-900 text-left hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded cursor-pointer disabled:cursor-default disabled:no-underline"
              disabled={!filterType || !filterValue || filterValue === 'all'}
              aria-label={`View all ${title}`}
            >
              {title}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                aria-hidden="true"
                role="presentation"
                focusable="false"
                style={{
                  display: 'inline-block',
                  fill: 'none',
                  height: '12px',
                  width: '12px',
                  stroke: 'currentColor',
                  strokeWidth: 5.33333,
                  overflow: 'visible',
                }}
              >
                <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <button
                aria-label="Scroll left"
                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                  isAtStart
                    ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm'
                }`}
                onClick={() => scrollContainer('left')}
                disabled={isAtStart}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 010 1.06L8.81 10l3.98 3.71a.75.75 0 11-1.06 1.06l-4.5-4.25a.75.75 0 010-1.06l4.5-4.25a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                aria-label="Scroll right"
                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                  isAtEnd
                    ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm'
                }`}
                onClick={() => scrollContainer('right')}
                disabled={isAtEnd}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.19 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className="flex overflow-x-auto scroll-smooth scrollbar-hide -mx-3"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 px-1 min-w-0 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-[calc(100%/7)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ListingCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CarouselSection;
