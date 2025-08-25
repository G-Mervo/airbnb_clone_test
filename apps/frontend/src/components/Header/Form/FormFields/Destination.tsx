// @ts-nocheck
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  setActiveInput,
  setDestinationInputVal,
  setMinimizeFormBtn,
  setOpenName,
  setRegion,
} from "../../../../redux/mainFormSlice";
import { getLocationSuggestions, locationKeys, LocationSuggestion } from "../../../../api/apiLocations";

// Static suggested destinations shown initially (before user types)
const STATIC_SUGGESTED_DESTINATIONS = [
  {
    title: "Nearby",
    subtitle: "Find what's around you",
    icon: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/ea5e5ee3-e9d8-48a1-b7e9-1003bf6fe850.png",
  },
  {
    title: "Myrtle Beach, SC",
    subtitle: "Popular beach destination",
    icon: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/b1cc1163-4fe3-4d40-898b-18c0c455f2b3.png",
  },
  {
    title: "Virginia Beach, VA",
    subtitle: "Family friendly",
    icon: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/99437893-7e64-49e5-bf62-8ae72a3d0321.png",
  },
  {
    title: "Ocean City, MD",
    subtitle: "Great for a weekend getaway",
    icon: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/ee4a17b0-99b3-4f19-8b51-e901ff279563.png",
  },
  {
    title: "Orlando, FL",
    subtitle: "For sights like Walt Disney World Resort",
    icon: "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/fa207fff-f2dc-4bf9-aa7c-d741bf9f621c.png",
  }
];

// Default icon for locations (using the nearby icon as fallback)
const DEFAULT_LOCATION_ICON = "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/ea5e5ee3-e9d8-48a1-b7e9-1003bf6fe850.png";

// Icon mapping for different location types and cities
const LOCATION_ICONS = {
  // Type-based icons
  'nearby': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/ea5e5ee3-e9d8-48a1-b7e9-1003bf6fe850.png",
  
  // City-specific icons (reusing existing icons)
  'Myrtle Beach': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/b1cc1163-4fe3-4d40-898b-18c0c455f2b3.png",
  'Virginia Beach': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/99437893-7e64-49e5-bf62-8ae72a3d0321.png",
  'Ocean City': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/ee4a17b0-99b3-4f19-8b51-e901ff279563.png",
  'Orlando': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/fa207fff-f2dc-4bf9-aa7c-d741bf9f621c.png",
  'New York': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/5b9968b7-ad38-46e6-9577-2a3554758c6d.png",
  'Miami Beach': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/acbd8c1c-145d-4852-8377-978addf8b029.png",
  'Miami': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/e08aa790-1daa-4665-ad59-55bed16435ea.png",
  'Kissimmee': "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/73966157-d937-494f-858b-962da9f24e8a.png",
};

const getLocationIcon = (location: LocationSuggestion): string => {
  // Try to find icon by city name first
  const cityKey = Object.keys(LOCATION_ICONS).find(key => 
    location.city.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(location.city.toLowerCase())
  );
  
  if (cityKey) {
    return LOCATION_ICONS[cityKey];
  }
  
  // Return default icon
  return DEFAULT_LOCATION_ICON;
};

const getLocationSubtitle = (location: LocationSuggestion): string => {
  switch (location.type) {
    case 'address':
      // For specific addresses, show the city
      return location.city ? `in ${location.city}` : 'Specific location';
    case 'city':
      // Check if it's a beach destination
      if (location.city.toLowerCase().includes('beach') || 
          location.city.toLowerCase().includes('ocean') ||
          location.city.toLowerCase().includes('myrtle')) {
        return 'Popular beach destination';
      }
      // Check if it's Orlando (Disney)
      if (location.city.toLowerCase().includes('orlando')) {
        return 'For sights like Walt Disney World Resort';
      }
      // Check if it's Miami
      if (location.city.toLowerCase().includes('miami')) {
        return 'Popular beach destination';
      }
      // Default for cities
      return 'Popular destination';
    case 'state':
      return 'Explore the state';
    case 'country':
      return 'Discover the country';
    default:
      return 'Great for a getaway';
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 10,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.95,
    transition: {
      duration: 0.15
    }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.2 }
  }
};

const loadingVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

// Component for static destination suggestions (shown when no typing)
const StaticDestinationItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: "#f7f7f7",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-colors duration-200"
      style={{ fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif' }}
    >
      <motion.div 
        className="rounded-2xl overflow-hidden" 
        style={{ width: 56, height: 56 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <img src={item.icon} alt="" className="w-full h-full object-cover" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-[14px] leading-[18px] font-medium text-[#222222]">{item.title}</span>
        <span className="text-[12px] leading-[16px] font-normal text-[#222222]">{item.subtitle}</span>
      </div>
    </motion.button>
  );
};

// Component for dynamic location suggestions (shown when typing)
const DestinationListItem = ({ location, onClick }: { location: LocationSuggestion; onClick: () => void }) => {
  const icon = getLocationIcon(location);
  const subtitle = getLocationSubtitle(location);

  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: "#f7f7f7",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-colors duration-200"
      style={{ fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif' }}
    >
      <motion.div 
        className="rounded-2xl overflow-hidden" 
        style={{ width: 56, height: 56 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <img src={icon} alt="" className="w-full h-full object-cover" />
      </motion.div>
      <div className="flex flex-col">
        <motion.span 
          className="text-[14px] leading-[18px] font-medium text-[#222222]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {location.full}
        </motion.span>
        <motion.span 
          className="text-[12px] leading-[16px] font-normal text-[#222222]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {subtitle}
        </motion.span>
      </div>
    </motion.button>
  );
};

const Destination = () => {
  const dispatch = useDispatch();
  
  // Get current input value from Redux store for typeahead
  const { destinationInputVal } = useSelector((store: any) => store.form);
  
  // Create search query - use the current input value for typeahead
  const searchQuery = destinationInputVal?.trim() || '';
  
  // Only fetch dynamic suggestions if user has typed something
  const shouldFetchDynamic = searchQuery.length > 0;
  
  // Fetch location suggestions based on current input (only when typing)
  const { data: locationSuggestions = [], isLoading } = useQuery({
    queryKey: locationKeys.suggestions(searchQuery),
    queryFn: () => getLocationSuggestions(searchQuery),
    enabled: shouldFetchDynamic, // Only fetch when user is typing
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleStaticSelect = (title: string) => {
    dispatch(setRegion("all"));
    dispatch(setDestinationInputVal(title));
    dispatch(setMinimizeFormBtn(""));
    dispatch(setOpenName("checkIn"));
    dispatch(setActiveInput("checkIn"));
  };

  const handleDynamicSelect = (location: LocationSuggestion) => {
    dispatch(setRegion("all"));
    dispatch(setDestinationInputVal(location.full));
    dispatch(setMinimizeFormBtn(""));
    dispatch(setOpenName("checkIn"));
    dispatch(setActiveInput("checkIn"));
  };

  const getHeaderText = () => {
    if (shouldFetchDynamic) {
      return isLoading ? 'Searching locations...' : `Search results for "${searchQuery}"`;
    }
    return 'Suggested destinations';
  };

  return (
    <motion.div 
      className="pt-6 px-4 shadow-2xl rounded-[2rem] z-50 w-full pb-4 bg-white"
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={getHeaderText()}
            variants={headerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mb-3 text-[12px] leading-4 font-normal text-[#222222]"
            style={{ fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif' }}
          >
            {getHeaderText()}
          </motion.p>
        </AnimatePresence>

        <div className="max-h-[420px] overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            {!shouldFetchDynamic ? (
              // Show static suggestions when no search query
              <motion.div
                key="static-suggestions"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-1"
              >
                {STATIC_SUGGESTED_DESTINATIONS.map((item, idx) => (
                  <StaticDestinationItem
                    key={`static-${item.title}-${idx}`}
                    item={item}
                    onClick={() => handleStaticSelect(item.title)}
                  />
                ))}
              </motion.div>
            ) : isLoading ? (
              // Show loading when searching
              <motion.div
                key="loading"
                variants={loadingVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center justify-center py-8"
              >
                <motion.div 
                  className="rounded-full h-8 w-8 border-b-2 border-[#FF385C]"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.div>
            ) : locationSuggestions.length > 0 ? (
              // Show dynamic search results
              <motion.div
                key="dynamic-suggestions"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-1"
              >
                {locationSuggestions.map((location, idx) => (
                  <DestinationListItem
                    key={`dynamic-${location.full}-${idx}`}
                    location={location}
                    onClick={() => handleDynamicSelect(location)}
                  />
                ))}
              </motion.div>
            ) : (
              // Show "no results" when search returns empty
              <motion.div
                key="no-results"
                variants={loadingVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center justify-center py-8 text-[#717171]"
              >
                <span className="text-[14px]">No destinations found</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Destination;
