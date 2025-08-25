import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { SpeedInsights } from '@vercel/speed-insights/react';

import Header from '../Header/Header';
import HomeSections from './HomeSections';
import LandingPageSkeleton from './LandingPageSkeleton';
import Footer from '../Footer/Footer';
import propertyService from '../../api/apiRooms';

import '../../input.css';

const Home = () => {
  const { startScroll, minimize, userData } = useSelector((state: any) => state.app);

  // We're on the home page, so we don't need to check other page conditions
  const minimizeHeader = minimize;
  const [showSkeleton, setShowSkeleton] = useState(true);

  const headerRef = useRef<HTMLDivElement | null>(null);

  // Query for properties using the backend API
  const {
    isLoading: isLoadingProperties,
    data: propertiesData,
    error: propertiesError,
  } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => propertyService.getRooms({ limit: 0 }), // Get all rooms
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Keep skeleton visible for minimum 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const shouldShowSkeleton = isLoadingProperties || showSkeleton;

  // Error handling for properties
  useEffect(() => {
    if (propertiesError) {
      console.error('Failed to load properties:', propertiesError);
    }
  }, [propertiesError]);

  // Debug: Log properties data when it loads
  useEffect(() => {
    if (propertiesData) {
      console.log('Properties loaded:', propertiesData);
    }
  }, [propertiesData]);

  const getHeaderClasses = () => {
    const baseClasses =
      'fixed transition-all duration-300 ease-in-out bg-[#f9f9f9] w-full flex items-start justify-center top-0';
    const zIndexClass = minimize ? 'z-[999999]' : 'z-10';
    const heightClass = startScroll
      ? minimize
        ? 'animate-collapse'
        : '1sm:h-[12rem]'
      : minimize
      ? 'animate-expand'
      : 'h-[5rem]';
    // Add divider to the complete header (both sections) - always show it
    const dividerClass = 'border-b border-neutral-200';

    return `${baseClasses} ${zIndexClass} ${heightClass} ${dividerClass}`;
  };

  // Show full page skeleton while loading or for minimum duration
  if (shouldShowSkeleton) {
    return <LandingPageSkeleton />;
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div ref={headerRef} id="header" className={getHeaderClasses()}>
        <Header headerRef={headerRef} />
      </div>

      <div className="w-full flex justify-center items-center mt-[9rem] 2xl:mt-[14rem] 1sm:mt-[15rem] pb-6">
        <div className="w-full 1xl:px-20 px-10">
          <HomeSections properties={propertiesData} isLoading={isLoadingProperties} />
        </div>
      </div>

      <Footer />
      <SpeedInsights />
    </div>
  );
};

export default Home;
