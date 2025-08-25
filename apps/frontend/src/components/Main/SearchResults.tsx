import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RoomSearchFilters, searchRooms } from '../../api/apiRooms';
import bookletIcon from '../../asset/Icons_svg/booklet.svg';
import { setSearchResultsCount } from '../../redux/AppSlice';
import { applyAllFilters, hasActiveFilters } from '../../utils/filterUtils';
import {
  generatePlaceholderImage,
  getSafeImageUrl,
  handleImageError,
} from '../../utils/imageUtils';
import { extractSearchFilters, formatSearchSummary } from '../../utils/searchUtils';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';

import MapSkeleton from './MapSkeleton';
import SearchResultsSkeleton from './SearchResultsSkeleton';

export default function SearchResults() {
  const dispatch = useDispatch();
  const [hoveredProperty, setHoveredProperty] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedPropertyData, setSelectedPropertyData] = useState<any | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
    position: 'below' | 'above';
  } | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [propertyId: number]: number }>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollGuardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerInView, setFooterInView] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [debouncedBounds, setDebouncedBounds] = useState<any>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [hasUserInteractedWithMap, setHasUserInteractedWithMap] = useState(false);
  const [initialMapSet, setInitialMapSet] = useState(false);

  // Helper functions for image navigation
  const getCurrentImageIndex = (propertyId: number) => {
    return currentImageIndex[propertyId] || 0;
  };

  const navigateImage = (
    propertyId: number,
    direction: 'next' | 'prev',
    imageCount: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent property card click
    const current = getCurrentImageIndex(propertyId);
    let newIndex;

    if (direction === 'next') {
      newIndex = current >= imageCount - 1 ? 0 : current + 1;
    } else {
      newIndex = current <= 0 ? imageCount - 1 : current - 1;
    }

    setCurrentImageIndex((prev) => ({
      ...prev,
      [propertyId]: newIndex,
    }));
  };

  const setImageIndex = (propertyId: number, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent property card click
    setCurrentImageIndex((prev) => ({
      ...prev,
      [propertyId]: index,
    }));
  };

  // Function to update map bounds
  const updateMapBounds = (mapInstance: any) => {
    if (!mapInstance || !mapInstance.getBounds) {
      console.warn('Map instance not available for bounds update');
      return;
    }

    try {
      const bounds = mapInstance.getBounds();
      if (bounds && typeof bounds.getNorth === 'function') {
        const newBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };

        // Validate bounds are reasonable numbers
        const isValidBounds = Object.values(newBounds).every(
          (val) => typeof val === 'number' && !isNaN(val) && isFinite(val),
        );

        if (isValidBounds) {
          setMapBounds(newBounds);
          console.log('Map bounds updated successfully:', newBounds);

          // Show search button if user has interacted with map
          if (hasUserInteractedWithMap) {
            setShowSearchButton(true);
          }
        } else {
          console.warn('Invalid bounds values:', newBounds);
        }
      } else {
        console.warn('Bounds object missing required methods');
      }
    } catch (error) {
      console.error('Error updating map bounds:', error);
    }
  };

  // Get search filter results from Redux (moved above useQuery to avoid scope issues)
  const { inputSearchIds } = useSelector((store: any) => store.app);
  const { displaySearch } = useSelector((store: any) => store.form);
  const mainFormState = useSelector((store: any) => store.form);
  const filterState = useSelector((store: any) => store.filter);
  const { hitSearch } = useSelector((store: any) => store.app);

  // Helper function to calculate pricing display text
  const getPricingText = React.useCallback(() => {
    const startDate = mainFormState.selectedStartDate;
    const endDate = mainFormState.selectedEndDate;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const nightsCount = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return nightsCount === 1 ? 'night' : `${nightsCount} nights`;
    }

    return 'per night';
  }, [mainFormState.selectedStartDate, mainFormState.selectedEndDate]);

  // Debounce map bounds to avoid excessive API calls
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedBounds(mapBounds);
    }, 400);
    return () => clearTimeout(t);
  }, [mapBounds]);

  // Get search results from backend API
  // Only refetch on map interaction or when hitSearch counter increases (submit button clicked)
  const {
    data: rooms,
    isFetching,
    refetch,
  } = useQuery<any[]>({
    queryKey: [
      'rooms-search',
      debouncedBounds,
      hasUserInteractedWithMap,
      hitSearch, // Only refetch when search is submitted
    ],
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    placeholderData: (previousData) => previousData, // Keep previous results while fetching new ones
    enabled: hitSearch > 0 || hasUserInteractedWithMap, // Only run query if search was submitted or map was interacted with
    queryFn: async ({ signal }) => {
      try {
        // Prefer location from extracted form filters; fallback to displaySearch.location
        const rawQuery =
          extractSearchFilters(mainFormState).location || displaySearch?.location || '';
        const query = rawQuery.trim();

        // Extract search filters from form state
        const searchFilters = extractSearchFilters(mainFormState);

        // If we have meaningful search criteria but no location query, use a default query
        // to ensure searchRooms is called instead of falling back to getRooms
        const finalQuery =
          query ||
          searchFilters.startDate ||
          searchFilters.endDate ||
          searchFilters.adults ||
          searchFilters.children ||
          searchFilters.infants ||
          searchFilters.pets ||
          (searchFilters.flexibleMonths && searchFilters.flexibleMonths.length > 0) ||
          searchFilters.stayDuration ||
          searchFilters.dateOption === 'flexible' ||
          searchFilters.monthDuration ||
          searchFilters.startDurationDate ||
          searchFilters.dateOption === 'month'
            ? 'anywhere'
            : '';

        const filters: RoomSearchFilters = {
          // Location filtering
          ...(finalQuery ? { location: finalQuery } : {}),
          // Date filtering - pass dates as ISO strings
          ...(searchFilters.startDate ? { check_in: searchFilters.startDate.toISOString() } : {}),
          ...(searchFilters.endDate ? { check_out: searchFilters.endDate.toISOString() } : {}),
          // Guest capacity filtering - use detailed breakdown when available
          ...(searchFilters.adults && searchFilters.adults > 0
            ? { adults: searchFilters.adults }
            : {}),
          ...(searchFilters.children && searchFilters.children > 0
            ? { children: searchFilters.children }
            : {}),
          ...(searchFilters.infants && searchFilters.infants > 0
            ? { infants: searchFilters.infants }
            : {}),
          ...(searchFilters.pets && searchFilters.pets > 0 ? { pets: searchFilters.pets } : {}),
          // Fallback to total guests if no detailed breakdown or legacy displaySearch
          ...(displaySearch?.guests && !searchFilters.adults
            ? { guests: displaySearch.guests }
            : {}),
          // Property filtering with 'Any' value handling
          ...(filterState?.bedrooms != null && filterState.bedrooms !== 'Any'
            ? { bedrooms: filterState.bedrooms }
            : {}),
          ...(filterState?.bathrooms != null && filterState.bathrooms !== 'Any'
            ? { bathrooms: filterState.bathrooms }
            : {}),
          // Map bounds filtering
          ...(debouncedBounds && hasUserInteractedWithMap
            ? {
                bounds: {
                  north: debouncedBounds.north,
                  south: debouncedBounds.south,
                  east: debouncedBounds.east,
                  west: debouncedBounds.west,
                },
              }
            : {}),
          // Flexible search filtering
          ...(searchFilters.flexibleMonths && searchFilters.flexibleMonths.length > 0
            ? { flexible_months: searchFilters.flexibleMonths }
            : {}),
          ...(searchFilters.stayDuration ? { stay_duration: searchFilters.stayDuration } : {}),
          ...(searchFilters.dateOption ? { date_option: searchFilters.dateOption } : {}),
          // Month mode filtering
          ...(searchFilters.monthDuration ? { month_duration: searchFilters.monthDuration } : {}),
          ...(searchFilters.startDurationDate
            ? { start_duration_date: searchFilters.startDurationDate.toISOString() }
            : {}),
          ...(searchFilters.dateFlexibility
            ? { date_flexibility: searchFilters.dateFlexibility }
            : {}),
          ...(searchFilters.startDateFlexibility
            ? { start_date_flexibility: searchFilters.startDateFlexibility }
            : {}),
          ...(searchFilters.endDateFlexibility
            ? { end_date_flexibility: searchFilters.endDateFlexibility }
            : {}),
        };

        console.log('Search filters being sent to API:', filters);
        console.log('Final query string:', finalQuery);
        console.log('Original query string:', query);
        console.log('Form state that triggered search:', {
          destinationInputVal: mainFormState.destinationInputVal,
          selectedStartDate: mainFormState.selectedStartDate,
          selectedEndDate: mainFormState.selectedEndDate,
          adultCount: mainFormState.adultCount,
          childCount: mainFormState.childCount,
          infantCount: mainFormState.infantCount,
          petsCount: mainFormState.petsCount,
          // Add flexible search data
          dateOption: mainFormState.dateOption,
          flexibleMonths: mainFormState.months,
          stayDuration: mainFormState.stayDuration,
          // Add month mode data
          monthDuration: mainFormState.curDot,
          startDurationDate: mainFormState.startDurationDate,
          dateFlexibility: mainFormState.dateFlexibility,
          startDateFlexibility: mainFormState.startDateFlexibility,
          endDateFlexibility: mainFormState.endDateFlexibility,
        });

        const data = await searchRooms(finalQuery, filters, { signal });
        console.log('API Response:', data.length, 'rooms received');

        return data ?? [];
      } catch (error) {
        console.error('Error fetching rooms from API:', error);
        // Fallback to empty array on error
        return [];
      }
    },
  });

  // Filter properties based on search
  const filteredProperties = React.useMemo<any[]>(() => {
    if (!rooms || !Array.isArray(rooms)) return [];

    let filtered = rooms;

    // Extract search filters from Redux state
    const searchFilters = extractSearchFilters(mainFormState);

    // Check if we have any meaningful search criteria
    const hasSearchCriteria =
      searchFilters.location ||
      (searchFilters.startDate && searchFilters.endDate) ||
      (searchFilters.adults && searchFilters.adults > 0) ||
      (searchFilters.children && searchFilters.children > 0) ||
      (searchFilters.infants && searchFilters.infants > 0) ||
      (searchFilters.pets && searchFilters.pets > 0);

    console.log('Search filters:', searchFilters);
    console.log('Has search criteria:', hasSearchCriteria);

    // Backend has already applied all filtering, so we just use the results directly
    console.log('Using API filtered results directly:', filtered.length, 'properties');

    // Only apply default US filtering when no search was performed at all
    // (i.e., this is the initial page load with absolutely no search parameters)
    const hasAnySearchParams = !!(
      searchFilters.location ||
      searchFilters.startDate ||
      searchFilters.endDate ||
      searchFilters.adults ||
      searchFilters.children ||
      searchFilters.infants ||
      searchFilters.pets
    );

    if (!hasAnySearchParams) {
      // Only for initial page load - show US properties by default
      console.log('Initial load: applying US default filter');
      filtered = rooms.filter(
        (room: any) =>
          room.country &&
          (room.country.toLowerCase() === 'united states' ||
            room.country.toLowerCase().includes('united states') ||
            room.country.toLowerCase() === 'usa' ||
            room.country.toLowerCase() === 'us'),
      );
      console.log('US filtered results:', filtered.length, 'out of', rooms.length);
    } else {
      console.log('Using backend search results as-is:', filtered.length, 'properties');
    }

    // Step 2: Transform to our Property interface (map from API Room shape)
    const transformedProperties: any[] = (filtered as any[]).map((room: any) => ({
      id: parseInt(room.id),
      title: room.title || 'Untitled',
      'house-title': room.title || 'Untitled',
      location: `${room?.city ?? ''}, ${room?.country ?? ''}`.replace(/^,\s+|,\s+$/g, ''),
      city: room?.city,
      country: room?.country,
      type: `${room?.bedrooms ?? 1} bed${(room.capacity?.bedrooms ?? 1) > 1 ? 's' : ''}`,
      beds: room?.bedrooms ?? 1,
      rating: room.average_rating ?? 4.5,
      house_rating: room.average_rating ?? 4.5,
      reviews: room.total_reviews ?? 0,
      price: room?.base_price ?? 100,
      image: (room.images && room.images[0]) || '/placeholder.svg',
      images: room.images ?? ['/placeholder.svg'],
      is_new: room.is_new || false,
      isFavorite: false, // This would come from user favorites
      coordinates:
        room?.latitude != null && room?.longitude != null
          ? [Number(room.latitude), Number(room.longitude)]
          : [39.8283, -98.5795], // Center of US as fallback

      // Additional fields used by local filtering code
      bedrooms: room?.bedrooms,
      bathrooms: room?.bathrooms ?? 1,
      propertyType: room.property_type,
      roomType: room.room_type,
      amenities: room.amenities ?? [],
      // Some of these may not exist in API; leave undefined if absent
      bookingOptions: room.bookingOptions,
      guestCapacity: room.capacity?.max_guests,
      availability: room.availability,
      host: room.host,
      isGuestFavorite: room.is_guest_favorite,
      accessibilityFeatures: room.accessibilityFeatures,
      // Individual amenity flags (if present in API) - check for actual data format
      wifi: (room.amenities || []).some((a: string) => a.toLowerCase().includes('wifi')),
      kitchen: (room.amenities || []).some((a: string) => a.toLowerCase().includes('kitchen')),
      ac: (room.amenities || []).some(
        (a: string) =>
          a.toLowerCase().includes('air conditioning') || a.toLowerCase().includes('ac'),
      ),
      washer: (room.amenities || []).some((a: string) => a.toLowerCase().includes('washer')),
      pool: (room.amenities || []).some((a: string) => a.toLowerCase().includes('pool')),
      gym: (room.amenities || []).some((a: string) => a.toLowerCase().includes('gym')),
      parking: (room.amenities || []).some((a: string) => a.toLowerCase().includes('parking')),
      tv: (room.amenities || []).some((a: string) => a.toLowerCase().includes('tv')),
      instantBook: room.is_instant_bookable,
      selfCheckin: (room.amenities || []).some((a: string) =>
        a.toLowerCase().includes('self check-in'),
      ),
      allowsPets: (room.amenities || []).some((a: string) => a.toLowerCase().includes('pets')),
    }));

    // Step 3: Apply comprehensive filters if any are active
    const hasFiltersActive = hasActiveFilters(filterState);
    console.log('Has filters active:', hasFiltersActive);
    console.log('Filter state:', filterState);

    if (hasFiltersActive) {
      const finalFiltered = applyAllFilters(transformedProperties as any, filterState) as any[];
      console.log(
        'Final filtered results:',
        finalFiltered.length,
        'out of',
        transformedProperties.length,
      );
      return finalFiltered;
    }

    return transformedProperties;
  }, [rooms, inputSearchIds, displaySearch, mainFormState, filterState]);

  const properties: any[] = filteredProperties as any[];

  // Pagination (6 cards per page)
  const PAGE_SIZE = 12; // 4 rows x 3 columns
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(properties.length / PAGE_SIZE));
  const pagedProperties = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return properties.slice(start, start + PAGE_SIZE);
  }, [properties, currentPage]);

  useEffect(() => {
    // Reset to first page when search results change
    setCurrentPage(1);
  }, [displaySearch, inputSearchIds]);

  // Control skeleton display timing - only on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
      // Update search results count after skeleton finishes loading
      dispatch(setSearchResultsCount(properties.length));
    }, 1500); // Reduced skeleton time

    return () => clearTimeout(timer);
  }, [dispatch, properties.length]);

  // Reset skeleton when search changes - but only for major navigation changes
  useEffect(() => {
    // Only show skeleton for significant search changes, not map interactions
    if (!hasUserInteractedWithMap) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        dispatch(setSearchResultsCount(properties.length));
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // For map interactions, just update the count
      dispatch(setSearchResultsCount(properties.length));
    }
    // Return undefined explicitly for the else case
    return undefined;
  }, [displaySearch, inputSearchIds, dispatch, properties.length, hasUserInteractedWithMap]);

  // Calculate map center based on properties or search location
  const getMapCenter = React.useMemo(() => {
    // Only default to US center for generic searches
    const shouldShowUSDefault =
      !displaySearch ||
      (displaySearch &&
        (displaySearch.toLowerCase().includes('nearby') ||
          displaySearch.toLowerCase().includes('anywhere') ||
          displaySearch.toLowerCase() === 'all' ||
          displaySearch.trim() === ''));

    // For specific location searches, always center on the properties found
    if (!shouldShowUSDefault && properties.length > 0) {
      const lats = properties.map((p) => p.coordinates[0]);
      const lngs = properties.map((p) => p.coordinates[1]);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Calculate zoom level based on bounds
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 10; // Balanced city view
      if (maxDiff > 2) zoom = 7;
      else if (maxDiff > 1) zoom = 8;
      else if (maxDiff > 0.5) zoom = 9;
      else if (maxDiff > 0.2) zoom = 10;
      else if (maxDiff > 0.1) zoom = 11;
      else zoom = 12;

      return { center: [centerLat, centerLng] as [number, number], zoom };
    }

    // For generic searches or when no specific search, show US overview
    if (shouldShowUSDefault && properties.length > 0) {
      const lats = properties.map((p) => p.coordinates[0]);
      const lngs = properties.map((p) => p.coordinates[1]);

      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

      return { center: [centerLat, centerLng] as [number, number], zoom: 5 };
    }

    // Fallback to US center when no properties or no search
    return { center: [39.8283, -98.5795] as [number, number], zoom: 4 };
  }, [properties, displaySearch]);

  // Initialize map when skeleton disappears
  useEffect(() => {
    if (
      !showSkeleton &&
      typeof window !== 'undefined' &&
      mapRef.current &&
      !mapInstanceRef.current
    ) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        import('leaflet').then((L) => {
          if (!mapRef.current || mapInstanceRef.current) return;

          // Start with proper center based on search
          const { center, zoom } = getMapCenter;
          const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);

          // Mark that initial map position has been set
          setInitialMapSet(true);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          mapInstanceRef.current = map;

          // Add click handler to map to close popup when clicking elsewhere
          map.on('click', () => {
            setSelectedProperty(null);
            setSelectedPropertyData(null);
            setPopupPosition(null);
          });

          // Handle map movement events for filtering
          map.on('movestart', () => {
            setHasUserInteractedWithMap(true);
            setInitialMapSet(true); // Ensure no resets after user interaction
          });

          map.on('zoomstart', () => {
            setHasUserInteractedWithMap(true);
            setInitialMapSet(true); // Ensure no resets after user interaction
          });

          map.on('moveend', () => {
            try {
              updateMapBounds(map);
            } catch (error) {
              console.warn('Error handling moveend event:', error);
            }
          });

          map.on('zoomend', () => {
            try {
              updateMapBounds(map);
            } catch (error) {
              console.warn('Error handling zoomend event:', error);
            }
          });

          const createCustomIcon = (price: number, isHovered = false, isSelected = false) => {
            const className = isSelected
              ? 'selected-marker'
              : isHovered
              ? 'hovered-marker'
              : 'price-marker';
            return L.divIcon({
              html: `<div class="${className}" style="pointer-events: auto; cursor: pointer;">$${price}</div>`,
              className: 'custom-div-icon',
              iconSize: [60, 30],
              iconAnchor: [30, 15],
            });
          };

          properties.forEach((property) => {
            const marker = L.marker(property.coordinates, {
              icon: createCustomIcon(property.price),
            }).addTo(map);

            markersRef.current.push({ id: property.id, marker, property });

            // Simple click handler - no hover interference
            marker.on('click', function () {
              console.log('Clicked property:', property.id);
              setSelectedProperty(property.id);
              setSelectedPropertyData(property);

              // Calculate popup position relative to marker with improved logic
              const map = mapInstanceRef.current;
              if (map && mapRef.current) {
                const markerLatLng = marker.getLatLng();
                const markerPoint = map.latLngToContainerPoint(markerLatLng);
                const mapRect = mapRef.current.getBoundingClientRect();

                // Popup dimensions
                const popupWidth = 326;
                const popupHeight = 300;
                const margin = 20; // Increased margin for better spacing
                const markerHeight = 30; // Approximate marker height
                const markerWidth = 60; // Approximate marker width

                // Calculate available space in all directions
                const spaceAbove = markerPoint.y - margin;
                const spaceBelow = mapRect.height - markerPoint.y - markerHeight - margin;
                const spaceLeft = markerPoint.x - margin;
                const spaceRight = mapRect.width - markerPoint.x - markerWidth - margin;

                let x, y;
                let position: 'below' | 'above' = 'below';

                // Smart vertical positioning
                if (spaceBelow >= popupHeight) {
                  // Plenty of space below - position below marker
                  y = markerPoint.y + markerHeight + 10;
                  position = 'below';
                } else if (spaceAbove >= popupHeight) {
                  // Not enough space below but enough above - position above marker
                  y = markerPoint.y - popupHeight - 10;
                  position = 'above';
                } else {
                  // Not enough space in either direction - center vertically in available space
                  const availableHeight = mapRect.height - 2 * margin;
                  const adjustedHeight = Math.min(popupHeight, availableHeight);
                  y = (mapRect.height - adjustedHeight) / 2;
                  position = 'below';
                }

                // Smart horizontal positioning - try to center on marker first
                x = markerPoint.x + markerWidth / 2 - popupWidth / 2;

                // Adjust if popup goes off-screen horizontally
                if (x < margin) {
                  // Too far left - align with left margin
                  x = margin;
                } else if (x + popupWidth > mapRect.width - margin) {
                  // Too far right - align with right margin
                  x = mapRect.width - popupWidth - margin;
                }

                // Final bounds check to ensure popup stays within map
                x = Math.max(margin, Math.min(x, mapRect.width - popupWidth - margin));
                y = Math.max(margin, Math.min(y, mapRect.height - popupHeight - margin));

                setPopupPosition({ x, y, position });
              }
            });

            // Add hover effects separately
            marker.on('mouseover', function () {
              if (selectedProperty !== property.id) {
                setHoveredProperty(property.id);
              }
            });

            marker.on('mouseout', function () {
              setHoveredProperty(null);
            });
          });

          const styleId = 'map-marker-style';
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
              .custom-div-icon {
                background: transparent !important;
                border: none !important;
                pointer-events: auto !important;
              }
              .leaflet-marker-icon {
                pointer-events: auto !important;
              }

              /* Price marker styles */
              .price-marker {
                background: white;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #222222;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
              }

              .price-marker:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                z-index: 1500;
              }

              .hovered-marker {
                background: white;
                border: 2px solid #222222;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #222222;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                cursor: pointer;
                transform: scale(1.1);
                z-index: 2000;
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
                transition: all 0.2s ease;
              }

              .selected-marker {
                background: #222222;
                border: 2px solid #222222;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: white;
                box-shadow: 0 6px 16px rgba(0,0,0,0.35);
                cursor: pointer;
                transform: scale(1.15);
                z-index: 3000;
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
                transition: all 0.2s ease;
              }
            `;
            document.head.appendChild(style);
          }
        });
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
        setInitialMapSet(false); // Reset for next map initialization
      }
    };
  }, [showSkeleton]); // Removed properties dependency to prevent map recreation

  // Set initial map center only once during map initialization - NEVER reset after that
  useEffect(() => {
    // Only set initial center when map is first created and we haven't set it yet
    if (mapInstanceRef.current && !initialMapSet && !showSkeleton) {
      if (properties.length > 0) {
        const { center, zoom } = getMapCenter;
        mapInstanceRef.current.setView(center, zoom);
      } else {
        // Set US center when no properties initially
        mapInstanceRef.current.setView([39.8283, -98.5795], 4);
      }
      setInitialMapSet(true);
      console.log('Map initial position set - will never reset again');
    }
  }, [showSkeleton, initialMapSet, properties.length, getMapCenter]);

  // When expanding/collapsing the map, ensure Leaflet recalculates size
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Give CSS a moment to apply layout change before invalidating size
    const t = setTimeout(() => {
      try {
        mapInstanceRef.current.invalidateSize();
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [isMapExpanded]);

  // When selection changes, update marker styles accordingly
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const createCustomIcon = (price: number, isHovered: boolean, isSelected: boolean) =>
        L.divIcon({
          html: `<div class="${
            isSelected ? 'selected-marker' : isHovered ? 'hovered-marker' : 'price-marker'
          }">$${price}</div>`,
          className: 'custom-div-icon',
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });
      markersRef.current.forEach(({ id, marker, property }) => {
        const isHovered = hoveredProperty === id;
        const isSelected = selectedProperty === id;
        marker.setIcon(createCustomIcon(property.price, isHovered, isSelected));
      });
    });
  }, [selectedProperty, hoveredProperty]);

  // Update markers when properties change (after initial map setup) - smooth transition without clearing all
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || showSkeleton) return;

    import('leaflet').then((L) => {
      const createCustomIcon = (price: number, isHovered = false, isSelected = false) => {
        const className = isSelected
          ? 'selected-marker'
          : isHovered
          ? 'hovered-marker'
          : 'price-marker';
        return L.divIcon({
          html: `<div class="${className}">$${price}</div>`,
          className: 'custom-div-icon',
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });
      };

      // Get current property IDs
      const newPropertyIds = new Set(properties.map((p) => p.id));
      const existingIds = new Set(markersRef.current.map((m) => m.id));

      // Step 1: Add new markers for properties that don't exist yet
      const newProperties = properties.filter((property) => {
        return (
          !existingIds.has(property.id) &&
          property.coordinates &&
          Array.isArray(property.coordinates) &&
          property.coordinates.length === 2 &&
          !isNaN(property.coordinates[0]) &&
          !isNaN(property.coordinates[1])
        );
      });

      // Add new markers with fade-in animation
      newProperties.forEach((property) => {
        const marker = L.marker(property.coordinates, {
          icon: createCustomIcon(property.price),
          opacity: 0, // Start invisible for smooth fade-in
        }).addTo(mapInstanceRef.current);

        // Smooth fade-in animation
        let opacity = 0;
        const fadeIn = () => {
          opacity += 0.1;
          if (opacity <= 1) {
            marker.setOpacity(opacity);
            requestAnimationFrame(fadeIn);
          } else {
            marker.setOpacity(1);
          }
        };
        requestAnimationFrame(fadeIn);

        markersRef.current.push({ id: property.id, marker, property });

        marker.on('click', function () {
          console.log('Clicked property:', property.id);
          setSelectedProperty(property.id);
          setSelectedPropertyData(property);

          // Calculate popup position relative to marker with improved logic
          const map = mapInstanceRef.current;
          if (map && mapRef.current) {
            const markerLatLng = marker.getLatLng();
            const markerPoint = map.latLngToContainerPoint(markerLatLng);
            const mapRect = mapRef.current.getBoundingClientRect();

            // Popup dimensions
            const popupWidth = 326;
            const popupHeight = 300;
            const margin = 20; // Increased margin for better spacing
            const markerHeight = 30; // Approximate marker height
            const markerWidth = 60; // Approximate marker width

            // Calculate available space in all directions
            const spaceAbove = markerPoint.y - margin;
            const spaceBelow = mapRect.height - markerPoint.y - markerHeight - margin;
            const spaceLeft = markerPoint.x - margin;
            const spaceRight = mapRect.width - markerPoint.x - markerWidth - margin;

            let x, y;
            let position: 'below' | 'above' = 'below';

            // Smart vertical positioning
            if (spaceBelow >= popupHeight) {
              // Plenty of space below - position below marker
              y = markerPoint.y + markerHeight + 10;
              position = 'below';
            } else if (spaceAbove >= popupHeight) {
              // Not enough space below but enough above - position above marker
              y = markerPoint.y - popupHeight - 10;
              position = 'above';
            } else {
              // Not enough space in either direction - center vertically in available space
              const availableHeight = mapRect.height - 2 * margin;
              const adjustedHeight = Math.min(popupHeight, availableHeight);
              y = (mapRect.height - adjustedHeight) / 2;
              position = 'below';
            }

            // Smart horizontal positioning - try to center on marker first
            x = markerPoint.x + markerWidth / 2 - popupWidth / 2;

            // Adjust if popup goes off-screen horizontally
            if (x < margin) {
              // Too far left - align with left margin
              x = margin;
            } else if (x + popupWidth > mapRect.width - margin) {
              // Too far right - align with right margin
              x = mapRect.width - popupWidth - margin;
            }

            // Final bounds check to ensure popup stays within map
            x = Math.max(margin, Math.min(x, mapRect.width - popupWidth - margin));
            y = Math.max(margin, Math.min(y, mapRect.height - popupHeight - margin));

            setPopupPosition({ x, y, position });
          }
        });

        marker.on('mouseover', function () {
          if (selectedProperty !== property.id) {
            setHoveredProperty(property.id);
          }
        });

        marker.on('mouseout', function () {
          setHoveredProperty(null);
        });
      });

      // Step 2: Update existing markers
      markersRef.current.forEach((markerData) => {
        const property = properties.find((p) => p.id === markerData.id);
        if (property) {
          const currentLatLng = markerData.marker.getLatLng();
          const [newLat, newLng] = property.coordinates;

          // Update position if changed
          if (
            Math.abs(currentLatLng.lat - newLat) > 0.0001 ||
            Math.abs(currentLatLng.lng - newLng) > 0.0001
          ) {
            markerData.marker.setLatLng(property.coordinates);
          }

          // Update icon if price changed
          if (markerData.property.price !== property.price) {
            markerData.marker.setIcon(createCustomIcon(property.price));
          }

          // Update property data
          markerData.property = property;
        }
      });

      // Step 3: Remove markers that no longer exist (with fade-out)
      const markersToRemove = markersRef.current.filter(({ id }) => !newPropertyIds.has(id));

      markersToRemove.forEach(({ marker }) => {
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          if (opacity >= 0) {
            marker.setOpacity(opacity);
            requestAnimationFrame(fadeOut);
          } else {
            mapInstanceRef.current.removeLayer(marker);
          }
        };
        requestAnimationFrame(fadeOut);
      });

      // Update markers reference to only include existing properties
      markersRef.current = markersRef.current.filter(({ id }) => newPropertyIds.has(id));
    });
  }, [properties, showSkeleton, selectedProperty]);

  // Keep selected data in sync when property list changes (e.g., new search)
  useEffect(() => {
    if (!selectedProperty) {
      setSelectedPropertyData(null);
      setPopupPosition(null);
      return;
    }
    const updated = (properties as any[]).find((p) => p.id === selectedProperty) || null;
    setSelectedPropertyData(updated);
  }, [properties, selectedProperty]);

  // Scroll guard: while the list can still scroll, consume wheel events
  // so only the list scrolls. Once at ends, allow page to scroll (map + footer move).
  useEffect(() => {
    const container = scrollGuardRef.current;
    const list = listRef.current;
    if (!container || !list) return;

    const onWheel = (e: WheelEvent) => {
      if (!list.contains(e.target as Node)) return;
      const deltaY = e.deltaY;
      const atTop = list.scrollTop <= 0;
      const atBottom = Math.ceil(list.scrollTop + list.clientHeight) >= list.scrollHeight;
      const scrollingDown = deltaY > 0;
      const scrollingUp = deltaY < 0;
      // If footer is visible, do not intercept upward scrolls so page can move up past footer first
      const shouldConsume =
        (scrollingDown && !atBottom) || (scrollingUp && !atTop && !footerInView);
      if (shouldConsume) {
        list.scrollTop += deltaY;
        e.preventDefault();
      }
    };

    // Only enable scroll guard when content actually overflows
    const enableGuard = () => list.scrollHeight > list.clientHeight;
    if (enableGuard()) {
      container.addEventListener('wheel', onWheel, { passive: false });
    }
    return () => container.removeEventListener('wheel', onWheel as any);
  }, [pagedProperties.length, footerInView]);

  // Observe footer visibility to relax the scroll guard when footer is on screen
  useEffect(() => {
    const el = footerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setFooterInView(!!entry?.isIntersecting);
      },
      { root: null, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Show welcome message if no search has been performed
  if (hitSearch === 0 && !hasUserInteractedWithMap) {
    return (
      <div className="min-h-screen bg-white">
        <Header headerRef={headerRef} showSkeleton={false} />
        <div className="flex justify-center items-center h-[calc(100vh-140px)]">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Start your search</h2>
            <p className="text-gray-600 mb-8">
              Use the search form above to find properties that match your needs.
            </p>
            <div className="text-sm text-gray-500">
              • Enter a destination
              <br />
              • Select your dates
              <br />
              • Add guests
              <br />• Click the search button
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header headerRef={headerRef} showSkeleton={showSkeleton} />

      {/* Image probe removed */}

      <div ref={scrollGuardRef} className="flex items-start bg-white min-h-[calc(100vh-140px)]">
        {/* Left Sidebar - Property List */}
        <div
          ref={listRef}
          className={`${
            isMapExpanded ? 'hidden' : 'w-1/2'
          } bg-white overflow-x-hidden flex justify-center relative z-10 min-h-[calc(100vh-140px)] ${
            showSkeleton || properties.length > PAGE_SIZE
              ? 'overflow-y-auto h-[calc(100vh-140px)]'
              : ''
          }`}
        >
          {/* Loading indicator removed for smoother map experience */}
          {showSkeleton ? (
            <SearchResultsSkeleton />
          ) : (
            <div className="w-full max-w-[1200px] p-4 relative">
              <div className="flex justify-between items-center mb-6">
                <motion.span
                  key={`search-summary-${properties.length}`}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    fontFamily:
                      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                    fontSize: '14px',
                    lineHeight: '18px',
                    fontWeight: 500,
                    letterSpacing: 'normal',
                    color: '#222222',
                  }}
                >
                  {formatSearchSummary(extractSearchFilters(mainFormState), properties.length)}
                </motion.span>
                <div className="flex items-center space-x-2">
                  <img src={bookletIcon} className="w-6 h-6" alt="Fees" />
                  <span
                    style={{
                      fontFamily:
                        '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                      fontSize: '14px',
                      lineHeight: '18px',
                      fontWeight: 500,
                      letterSpacing: 'normal',
                      color: '#222222',
                    }}
                  >
                    Prices include all fees
                  </span>
                </div>
              </div>

              {properties.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center items-center h-64"
                >
                  <div className="text-gray-500">No properties found matching your search.</div>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <AnimatePresence mode="wait">
                      {pagedProperties.map((property) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.15,
                            ease: 'easeInOut',
                          }}
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredProperty(property.id)}
                          onMouseLeave={() => setHoveredProperty(null)}
                          onClick={() => window.open(`/house/${property.id}`, '_blank')}
                        >
                          <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100 mb-1.5">
                            {property.is_new && (
                              <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium text-gray-900 bg-white rounded-lg shadow-sm">
                                New
                              </span>
                            )}
                            {property.house_rating >= 4.9 && (
                              <span className="absolute left-3 top-3 bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                                🏆 Guest favorite
                              </span>
                            )}
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="flex absolute top-3 right-3 z-10 justify-center items-center w-7 h-7 bg-transparent border-none transition-transform pointer-events-auto hover:scale-110"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  property.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
                                }`}
                              />
                            </button>
                            {property.images && property.images.length > 0 ? (
                              <>
                                {/* Image carousel */}
                                <div className="relative w-full h-full">
                                  <img
                                    src={
                                      getSafeImageUrl(
                                        property.images[getCurrentImageIndex(property.id)],
                                      ) || property.images[getCurrentImageIndex(property.id)]
                                    }
                                    alt={`${property.title} - Image ${
                                      getCurrentImageIndex(property.id) + 1
                                    }`}
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      const firstLetter =
                                        property.title?.charAt(0)?.toUpperCase() ||
                                        property['property_name']?.charAt(0)?.toUpperCase() ||
                                        'H';
                                      handleImageError(e.currentTarget, firstLetter);
                                    }}
                                  />

                                  {/* Navigation arrows - only show if more than 1 image */}
                                  {property.images.length > 1 && (
                                    <>
                                      <button
                                        onClick={(e) =>
                                          navigateImage(
                                            property.id,
                                            'prev',
                                            property.images.length,
                                            e,
                                          )
                                        }
                                        className="flex absolute left-2 top-1/2 z-10 justify-center items-center w-7 h-7 rounded-full shadow-sm opacity-0 transition-opacity -translate-y-1/2 bg-white/90 hover:bg-white group-hover:opacity-100 hover:shadow-md"
                                      >
                                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          navigateImage(
                                            property.id,
                                            'next',
                                            property.images.length,
                                            e,
                                          )
                                        }
                                        className="flex absolute right-2 top-1/2 z-10 justify-center items-center w-7 h-7 rounded-full shadow-sm opacity-0 transition-opacity -translate-y-1/2 bg-white/90 hover:bg-white group-hover:opacity-100 hover:shadow-md"
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-700" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Pagination dots - only show if more than 1 image */}
                                {property.images.length > 1 && (
                                  <div className="flex absolute bottom-3 left-1/2 z-10 gap-1 -translate-x-1/2">
                                    {property.images.map((_: any, index: number) => (
                                      <button
                                        key={index}
                                        onClick={(e) => setImageIndex(property.id, index, e)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                                          getCurrentImageIndex(property.id) === index
                                            ? 'bg-white shadow-sm scale-110'
                                            : 'bg-white/60 hover:bg-white/80'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex justify-center items-center w-full h-full text-sm text-gray-400">
                                No image available
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-2">
                                <h3
                                  className="line-clamp-1"
                                  style={{
                                    fontFamily:
                                      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 500,
                                    letterSpacing: 'normal',
                                    color: '#222222',
                                  }}
                                >
                                  {property.title}
                                </h3>
                                <p
                                  className="mt-0.5"
                                  style={{
                                    fontFamily:
                                      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 400,
                                    letterSpacing: 'normal',
                                    color: '#6A6A6A',
                                  }}
                                >
                                  {property.location}
                                </p>
                                <p
                                  style={{
                                    fontFamily:
                                      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 400,
                                    letterSpacing: 'normal',
                                    color: '#6A6A6A',
                                  }}
                                >
                                  {property.type}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-gray-700 fill-current" />
                                <span
                                  style={{
                                    fontFamily:
                                      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                    fontSize: '15px',
                                    lineHeight: '19px',
                                    fontWeight: 400,
                                    letterSpacing: 'normal',
                                    color: '#6A6A6A',
                                  }}
                                >
                                  {property.rating.toFixed(1)} ({property.reviews})
                                </span>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span
                                style={{
                                  fontFamily:
                                    '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                  fontSize: '15px',
                                  lineHeight: '19px',
                                  fontWeight: 600,
                                  letterSpacing: 'normal',
                                  color: '#222222',
                                  textDecoration: 'underline',
                                }}
                              >
                                ${property.price}
                              </span>
                              <span
                                className="ml-1"
                                style={{
                                  fontFamily:
                                    '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                                  fontSize: '15px',
                                  lineHeight: '19px',
                                  fontWeight: 400,
                                  letterSpacing: 'normal',
                                  color: '#6A6A6A',
                                }}
                              >
                                night
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex gap-4 justify-center items-center mt-6">
                      <button
                        className={`h-9 w-9 flex items-center justify-center rounded-full border ${
                          currentPage === 1
                            ? 'text-gray-400 border-gray-200'
                            : 'text-gray-900 border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        ‹
                      </button>
                      {/* Page numbers (simple window) */}
                      {Array.from({ length: totalPages })
                        .slice(0, totalPages)
                        .map((_, i) => i + 1)
                        .filter((n) => {
                          // show first, last, current, and neighbors
                          return n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1;
                        })
                        .map((n, idx, arr) => (
                          <React.Fragment key={n}>
                            {idx > 0 && arr[idx - 1] !== n - 1 && (
                              <span className="px-1 text-gray-400">…</span>
                            )}
                            <button
                              className={`min-w-9 h-9 px-3 flex items-center justify-center rounded-full border ${
                                n === currentPage
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'text-gray-900 border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => setCurrentPage(n)}
                            >
                              {n}
                            </button>
                          </React.Fragment>
                        ))}
                      <button
                        className={`h-9 w-9 flex items-center justify-center rounded-full border ${
                          currentPage === totalPages
                            ? 'text-gray-400 border-gray-200'
                            : 'text-gray-900 border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Interactive Map (sticky) */}
        <div
          className={`${
            isMapExpanded ? 'pr-6 pl-6 w-full' : 'pr-6 pl-6 w-1/2'
          } py-6 bg-white sticky top-20 z-0`}
        >
          {showSkeleton ? (
            <MapSkeleton />
          ) : (
            <div
              className={`overflow-hidden relative bg-gray-100 rounded-xl h-[calc(100vh-140px)]`}
            >
              <div ref={mapRef} className="w-full h-full" style={{ minHeight: '600px' }} />

              {/* Subtle loading indicator for map interactions */}
              {isFetching && hasUserInteractedWithMap && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none z-[1100]">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="flex flex-col items-center gap-4">
                      {/* Three dots loading pattern matching the image */}
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected property overlay card */}
              {selectedPropertyData && popupPosition && (
                <div
                  className="absolute bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] overflow-hidden z-[1100] transition-all duration-200 ease-out"
                  style={{
                    width: '326px',
                    height: '300px',
                    left: `${popupPosition.x}px`,
                    top: `${popupPosition.y}px`,
                    transformOrigin:
                      popupPosition.position === 'above' ? 'bottom center' : 'top center',
                  }}
                >
                  <div
                    className="flex flex-col h-full cursor-pointer"
                    onClick={() => window.open(`/house/${selectedPropertyData.id}`, '_blank')}
                  >
                    <div className="relative" style={{ width: '326px', height: '211px' }}>
                      {selectedPropertyData.images?.[0] ? (
                        <img
                          src={
                            getSafeImageUrl(selectedPropertyData.images[0]) ||
                            selectedPropertyData.images[0]
                          }
                          alt={selectedPropertyData.title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const firstLetter =
                              selectedPropertyData.title?.charAt(0)?.toUpperCase() ||
                              selectedPropertyData['house-title']?.charAt(0)?.toUpperCase() ||
                              'H';
                            handleImageError(e.currentTarget as any, firstLetter);
                          }}
                        />
                      ) : (
                        <div
                          className="flex justify-center items-center w-full h-full"
                          style={{
                            backgroundImage: `url(${generatePlaceholderImage(
                              selectedPropertyData.title?.charAt(0)?.toUpperCase() ||
                                selectedPropertyData['house-title']?.charAt(0)?.toUpperCase() ||
                                'H',
                            )})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 px-4 py-3" style={{ height: '88px' }}>
                      <div className="flex justify-between items-center mb-1">
                        <h3
                          className="flex-1 pr-4 truncate"
                          style={{
                            fontFamily:
                              '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                            fontSize: '15px',
                            lineHeight: '19px',
                            fontWeight: 500,
                            letterSpacing: 'normal',
                            color: '#222222',
                          }}
                        >
                          {selectedPropertyData.title}
                        </h3>
                        <div className="flex gap-1 items-center">
                          <span style={{ color: '#222222' }}>★</span>
                          <span
                            style={{
                              fontFamily:
                                '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                              fontSize: '15px',
                              lineHeight: '19px',
                              fontWeight: 400,
                              letterSpacing: 'normal',
                              color: '#6A6A6A',
                            }}
                          >
                            {selectedPropertyData.rating.toFixed(1)} ({selectedPropertyData.reviews}
                            )
                          </span>
                        </div>
                      </div>
                      <div
                        className="mb-1 truncate"
                        style={{
                          fontFamily:
                            '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                          fontSize: '15px',
                          lineHeight: '19px',
                          fontWeight: 400,
                          letterSpacing: 'normal',
                          color: '#6A6A6A',
                        }}
                      >
                        {selectedPropertyData.location}
                      </div>
                      <div className="flex gap-1 items-center">
                        <span
                          style={{
                            fontFamily:
                              '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                            fontSize: '15px',
                            lineHeight: '19px',
                            fontWeight: 600,
                            letterSpacing: 'normal',
                            color: '#222222',
                          }}
                        >
                          ${selectedPropertyData.price}
                        </span>
                        <span
                          className="ml-1"
                          style={{
                            fontFamily:
                              '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif',
                            fontSize: '15px',
                            lineHeight: '19px',
                            fontWeight: 400,
                            letterSpacing: 'normal',
                            color: '#6A6A6A',
                          }}
                        >
                          {getPricingText()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex absolute top-3 right-3 z-10 justify-center items-center w-6 h-6 rounded-full shadow-md bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProperty(null);
                    }}
                    aria-label="Close"
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#222222',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Search this area button */}
              {showSearchButton && !isFetching && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                  <button
                    onClick={() => {
                      setShowSearchButton(false);
                      refetch();
                    }}
                    className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-800 hover:scale-105"
                  >
                    <Search className="w-4 h-4" />
                    Search this area
                  </button>
                </div>
              )}

              {/* Expand (circle) */}
              <div className="absolute top-4 right-4 z-[1000]">
                <button
                  aria-label={isMapExpanded ? 'Collapse map' : 'Expand map'}
                  onClick={() => setIsMapExpanded((v) => !v)}
                  className="flex justify-center items-center w-10 h-10 bg-white rounded-full border border-gray-200 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {isMapExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Zoom controls (shared pill with divider) */}
              <div className="absolute top-16 right-4 z-[1000]">
                <div className="flex overflow-hidden flex-col bg-white rounded-full border border-gray-200 shadow-sm">
                  <button
                    aria-label="Zoom in"
                    onClick={() => mapInstanceRef.current?.zoomIn()}
                    className="flex justify-center items-center w-10 h-10 transition-colors hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-gray-200" />
                  <button
                    aria-label="Zoom out"
                    onClick={() => mapInstanceRef.current?.zoomOut()}
                    className="flex justify-center items-center w-10 h-10 transition-colors hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={footerRef}>
        <Footer />
      </div>

      {/* Load Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  );
}
