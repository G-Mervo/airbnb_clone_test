// @ts-nocheck
'use client';

import type React from 'react';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  setPriceRange,
  setPlaceType,
  setRoomCount,
  toggleAmenity,
  toggleRecommended,
  toggleBookingOption,
  togglePropertyType,
  toggleAccessibilityFeature,
  toggleHostLanguage,
  toggleStandoutStay,
  clearAllFilters,
} from '../../redux/filterSlice';
import { extractSearchFilters } from '../../utils/searchUtils';
import { applyAllFilters, hasActiveFilters } from '../../utils/filterUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  ChevronDown,
  Home,
  Building2,
  Hotel,
  Store,
  ChevronUp,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function FilterModal() {
  const dispatch = useDispatch();
  const filterState = useSelector((store: any) => store.filter);
  const { searchResultsCount } = useSelector((store: any) => store.app);
  const mainFormState = useSelector((store: any) => store.form);

  // Get the same data that SearchResults uses - use the new API search
  const { data: rooms } = useQuery<any[]>({
    queryKey: [
      'rooms-search-for-filter',
      mainFormState.destinationInputVal,
      mainFormState.selectedStartDate,
      mainFormState.selectedEndDate,
      mainFormState.adultCount,
      mainFormState.childCount,
      mainFormState.infantCount,
      mainFormState.petsCount,
    ],
    queryFn: async ({ signal }) => {
      try {
        const { searchRooms } = await import('../../api/apiRooms');
        const { extractSearchFilters } = await import('../../utils/searchUtils');

        // Extract search filters from form state (same as SearchResults)
        const searchFilters = extractSearchFilters(mainFormState);
        const rawQuery = searchFilters.location || '';
        const query = rawQuery.trim();

        const filters: any = {
          // Location filtering
          ...(query ? { location: query } : {}),
          // Date filtering - pass dates as ISO strings
          ...(searchFilters.startDate ? { check_in: searchFilters.startDate.toISOString() } : {}),
          ...(searchFilters.endDate ? { check_out: searchFilters.endDate.toISOString() } : {}),
          // Guest capacity filtering
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
        };

        const data = await searchRooms(query, filters, { signal });
        return data ?? [];
      } catch (error) {
        console.error('Error fetching rooms for filter:', error);
        return [];
      }
    },
  });

  // Modal and UI state (keep local)
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);
  const calculatingTimerRef = useRef<number | null>(null);
  const [chartVariant, setChartVariant] = useState(0);
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [openSections, setOpenSections] = useState({ features: false });
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

  // Local pending state - only commit to Redux when button is clicked
  const [pendingFilters, setPendingFilters] = useState(() => filterState);

  // Sync pending filters with Redux state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPendingFilters(filterState);
      // Reset loader state on each open to avoid stale spinners
      setIsLoading(false);
      setIsCalculating(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      if (calculatingTimerRef.current) {
        clearTimeout(calculatingTimerRef.current);
        calculatingTimerRef.current = null;
      }
    }
  }, [isOpen, filterState]);

  // Use pending filter values instead of Redux state
  const {
    minPrice,
    maxPrice,
    placeType,
    bedrooms,
    beds,
    bathrooms,
    selectedAmenities,
    selectedRecommended,
    selectedBookingOptions,
    selectedPropertyTypes,
    selectedAccessibilityFeatures,
    selectedHostLanguages,
    selectedStandoutStays,
  } = pendingFilters;

  // Calculate the count that would result from applying pending filters
  const pendingResultsCount = useMemo(() => {
    if (!rooms) return 0;

    // Transform API data to the same format as SearchResults (rooms is already filtered by backend)
    let filtered = rooms || [];

    // Extract search filters from Redux state (same as SearchResults)
    const searchFilters = extractSearchFilters(mainFormState);

    // Apply default US filtering only when no search was performed at all
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
      filtered = rooms.filter(
        (room: any) =>
          room.country &&
          (room.country.toLowerCase() === 'united states' ||
            room.country.toLowerCase().includes('united states') ||
            room.country.toLowerCase() === 'usa' ||
            room.country.toLowerCase() === 'us'),
      );
    }

    // Transform to the same format as SearchResults (exact same transformation)
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
      isFavorite: false,
      coordinates:
        room?.latitude != null && room?.longitude != null
          ? [Number(room.latitude), Number(room.longitude)]
          : [39.8283, -98.5795],

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

    // Apply pending filters if any are active
    const hasPendingFiltersActive = hasActiveFilters(pendingFilters);
    if (hasPendingFiltersActive) {
      const finalFiltered = applyAllFilters(transformedProperties as any, pendingFilters);
      return finalFiltered.length;
    }

    return transformedProperties.length;
  }, [rooms, mainFormState, pendingFilters]);

  // Price slider config
  const PRICE_MIN = 0;
  const PRICE_MAX = 8000;
  const BUCKETS = 60;
  const bucketSize = (PRICE_MAX - PRICE_MIN) / BUCKETS;

  const recommendedOptions = [
    { id: 'parking', label: 'Free parking', imageSrc: '/images/free-parking-icon.png' },
    { id: 'pets', label: 'Allows pets', imageSrc: '/images/allows-pets-icon.png' },
    { id: 'checkin', label: 'Self check-in', imageSrc: '/images/self-check-in-icon.png' },
    { id: 'tv', label: 'TV', imageSrc: '/images/tv-icon.png' },
  ];

  const chartDataVariations = useMemo<number[][]>(
    () => [
      // Original data
      [
        2, 2, 3, 3, 4, 5, 6, 8, 10, 9, 8, 11, 13, 10, 12, 15, 18, 22, 19, 16, 18, 15, 13, 12, 10, 9,
        10, 11, 13, 15, 17, 18, 16, 14, 12, 10, 9, 8, 7, 7, 6, 6, 7, 9, 10, 12, 14, 16, 18, 16, 14,
        12, 10, 9, 7, 6, 5, 4, 3,
      ],
      // Variation 1 - more activity in middle
      [
        1, 2, 2, 4, 5, 7, 9, 12, 15, 18, 20, 22, 25, 23, 21, 19, 17, 20, 18, 16, 14, 12, 15, 17, 19,
        16, 14, 12, 10, 8, 9, 11, 13, 15, 12, 10, 8, 6, 5, 4, 5, 6, 8, 10, 12, 14, 16, 15, 13, 11,
        9, 7, 6, 5, 4, 3, 2, 2, 1,
      ],
      // Variation 2 - peak shifted left
      [
        8, 12, 15, 18, 20, 22, 19, 16, 14, 12, 10, 8, 9, 11, 13, 10, 8, 6, 5, 7, 9, 11, 8, 6, 5, 4,
        6, 8, 10, 7, 5, 4, 3, 5, 7, 9, 6, 4, 3, 2, 3, 4, 5, 6, 4, 3, 2, 3, 4, 5, 3, 2, 2, 3, 2, 1,
        1, 2, 1,
      ],
      // Variation 3 - more distributed
      [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 12, 14, 16, 15, 13, 14, 16, 18, 17, 15, 13, 11, 12,
        14, 16, 15, 13, 11, 9, 10, 12, 14, 13, 11, 9, 7, 8, 9, 10, 8, 6, 7, 9, 11, 10, 8, 6, 5, 6,
        7, 5, 4, 5, 6, 4, 3, 2,
      ],
    ],
    [],
  );

  const chartData = chartDataVariations[chartVariant];

  // Update chart when pending filters change for immediate visual feedback
  useEffect(() => {
    setChartVariant((prev) => (prev + 1) % chartDataVariations.length);
  }, [
    pendingFilters.placeType,
    pendingFilters.bedrooms,
    pendingFilters.beds,
    pendingFilters.bathrooms,
    pendingFilters.selectedAmenities,
    pendingFilters.selectedRecommended,
    pendingFilters.selectedBookingOptions,
    pendingFilters.selectedPropertyTypes,
    pendingFilters.selectedAccessibilityFeatures,
    pendingFilters.selectedHostLanguages,
    pendingFilters.selectedStandoutStays,
    chartDataVariations.length,
  ]);

  const amenityCategories = {
    popular: [
      { id: 'ac', label: 'Air conditioning' },
      { id: 'wifi', label: 'Wifi' },
      { id: 'tv', label: 'TV' },
      { id: 'kitchen', label: 'Kitchen' },
      { id: 'gym', label: 'Gym' },
      { id: 'pool', label: 'Pool' },
    ],
    essentials: [
      { id: 'washer', label: 'Washer' },
      { id: 'dryer', label: 'Dryer' },
      { id: 'heating', label: 'Heating' },
      { id: 'workspace', label: 'Dedicated workspace' },
      { id: 'hairdryer', label: 'Hair dryer' },
      { id: 'iron', label: 'Iron' },
    ],
    features: [
      { id: 'hottub', label: 'Hot tub' },
      { id: 'freeparking', label: 'Free parking' },
      { id: 'evcharger', label: 'EV charger' },
      { id: 'crib', label: 'Crib' },
      { id: 'kingbed', label: 'King bed' },
      { id: 'bbqgrill', label: 'BBQ grill' },
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'fireplace', label: 'Indoor fireplace' },
      { id: 'smokingallowed', label: 'Smoking allowed' },
    ],
    location: [
      { id: 'waterfront', label: 'Waterfront' },
      { id: 'skiinskiout', label: 'Ski-in/ski-out' },
    ],
    safety: [
      { id: 'smokealarm', label: 'Smoke alarm' },
      { id: 'carbonmonoxidealarm', label: 'Carbon monoxide alarm' },
    ],
  };

  const bookingOptions = [
    { id: 'instant', label: 'Instant Book' },
    { id: 'selfcheckin', label: 'Self-check-in' },
    { id: 'allowspets', label: 'Allows pets' },
  ];

  // Trigger calculation effect when any filter changes
  const triggerCalculation = () => {
    if (calculatingTimerRef.current) {
      clearTimeout(calculatingTimerRef.current);
    }
    setIsCalculating(true);
    calculatingTimerRef.current = window.setTimeout(() => {
      setIsCalculating(false);
    }, 400);
  };

  // Helper functions that update local pending state
  const handleToggleRecommended = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedRecommended: prev.selectedRecommended.includes(id)
        ? prev.selectedRecommended.filter((item) => item !== id)
        : [...prev.selectedRecommended, id],
    }));
    triggerCalculation();
  };
  const handleToggleAmenity = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(id)
        ? prev.selectedAmenities.filter((item) => item !== id)
        : [...prev.selectedAmenities, id],
    }));
    triggerCalculation();
  };
  const handleToggleBookingOption = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedBookingOptions: prev.selectedBookingOptions.includes(id)
        ? prev.selectedBookingOptions.filter((item) => item !== id)
        : [...prev.selectedBookingOptions, id],
    }));
    triggerCalculation();
  };
  const handleTogglePropertyType = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedPropertyTypes: prev.selectedPropertyTypes.includes(id)
        ? prev.selectedPropertyTypes.filter((item) => item !== id)
        : [...prev.selectedPropertyTypes, id],
    }));
    triggerCalculation();
  };
  const handleToggleAccessibilityFeature = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedAccessibilityFeatures: prev.selectedAccessibilityFeatures.includes(id)
        ? prev.selectedAccessibilityFeatures.filter((item) => item !== id)
        : [...prev.selectedAccessibilityFeatures, id],
    }));
    triggerCalculation();
  };
  const handleToggleHostLanguage = (id: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedHostLanguages: prev.selectedHostLanguages.includes(id)
        ? prev.selectedHostLanguages.filter((item) => item !== id)
        : [...prev.selectedHostLanguages, id],
    }));
    triggerCalculation();
  };
  const handleToggleStandoutStay = (stay: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedStandoutStays: prev.selectedStandoutStays.includes(stay)
        ? prev.selectedStandoutStays.filter((item) => item !== stay)
        : [...prev.selectedStandoutStays, stay],
    }));
    triggerCalculation();
  };
  const toggleSection = (section: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [section]: open }));
  };

  const incrementValue = (current: string, type: 'bedrooms' | 'beds' | 'bathrooms') => {
    const newValue = current === 'Any' ? '1' : (Number.parseInt(current) + 1).toString();
    setPendingFilters((prev) => ({ ...prev, [type]: newValue }));
    triggerCalculation();
  };
  const decrementValue = (current: string, type: 'bedrooms' | 'beds' | 'bathrooms') => {
    const newValue =
      current === 'Any' || current === '1' ? 'Any' : (Number.parseInt(current) - 1).toString();
    setPendingFilters((prev) => ({ ...prev, [type]: newValue }));
    triggerCalculation();
  };

  const clearAll = () => {
    // Reset pending filters to initial state
    setPendingFilters({
      minPrice: 0,
      maxPrice: 8000,
      placeType: 'Any type',
      bedrooms: 'Any',
      beds: 'Any',
      bathrooms: 'Any',
      selectedAmenities: [],
      selectedRecommended: [],
      selectedBookingOptions: [],
      selectedPropertyTypes: [],
      selectedAccessibilityFeatures: [],
      selectedHostLanguages: [],
      selectedStandoutStays: [],
      showTotalBeforeTaxes: false,
    });
    setOpenSections({ features: false });
  };

  // Chart coloring based on slider range — chart heights never change
  const minIndex = Math.max(0, Math.min(BUCKETS - 1, Math.floor(minPrice / bucketSize)));
  const maxIndex = Math.max(0, Math.min(BUCKETS - 1, Math.floor(maxPrice / bucketSize)));

  // Inputs parsing
  const formatPrice = (v: number) => {
    if (v >= PRICE_MAX) return `$${PRICE_MAX}+`;
    return `$${v}`;
  };
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const onMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const val = clamp(Number.parseInt(raw || '0', 10), PRICE_MIN, Math.min(maxPrice, PRICE_MAX));
    setPendingFilters((prev) => ({ ...prev, minPrice: val }));
  };
  const onMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const val = clamp(Number.parseInt(raw || '0', 10), Math.max(minPrice, PRICE_MIN), PRICE_MAX);
    setPendingFilters((prev) => ({ ...prev, maxPrice: val }));
  };

  const GRAPH_COLOR = '#e21c5e';
  const TRACK_LIGHT = 'rgba(226, 28, 94, 0.25)'; // light background for the full track
  const OUT_RANGE_GRAY = '#d1d5db'; // Tailwind gray-300 equivalent

  const propertyTypes = [
    { id: 'house', label: 'House', Icon: Home },
    { id: 'apartment', label: 'Apartment', Icon: Building2 },
    { id: 'guesthouse', label: 'Guesthouse', Icon: Store },
    { id: 'hotel', label: 'Hotel', Icon: Hotel },
  ];

  const getFeatureIcon = (id: string) => {
    const iconMap: { [key: string]: string } = {
      hottub: '/images/hot-tub-icon.svg',
      freeparking: '/images/features-free-parking-icon.svg',
      evcharger: '/images/ev-charger-icon.svg',
      crib: '/images/crib-icon.svg',
      kingbed: '/images/king-bed-icon.svg',
      bbqgrill: '/images/bbq-grill-icon.svg',
      breakfast: '/images/breakfast-icon.svg',
      fireplace: '/images/indoor-fireplace-icon.svg',
      smokingallowed: '/images/smoking-allowed-icon.svg',
    };
    return iconMap[id] || '';
  };

  const formatSearchResultsText = (count: number) => {
    if (count === 0) return 'No places found';
    if (count === 1) return 'Show 1 place';
    if (count >= 1000) return `Show ${Math.floor(count / 100) * 100}+ places`;
    return `Show ${count} places`;
  };

  const handleShowPlaces = () => {
    // Start loading animation
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setIsLoading(true);

    // Commit all pending filter changes to Redux
    dispatch(setPriceRange({ min: pendingFilters.minPrice, max: pendingFilters.maxPrice }));
    dispatch(setPlaceType(pendingFilters.placeType));
    dispatch(setRoomCount({ type: 'bedrooms', value: pendingFilters.bedrooms }));
    dispatch(setRoomCount({ type: 'beds', value: pendingFilters.beds }));
    dispatch(setRoomCount({ type: 'bathrooms', value: pendingFilters.bathrooms }));

    // Update all the array-based filters
    // Note: This is a simplified approach. In a real app, you'd want to calculate the diff
    // and only dispatch the necessary changes, but for now we'll update everything
    Object.keys(filterState).forEach((key) => {
      if (key.startsWith('selected') && Array.isArray(pendingFilters[key])) {
        const pendingValue = pendingFilters[key];
        const currentValue = filterState[key];

        // Only update if values are different
        if (JSON.stringify(pendingValue.sort()) !== JSON.stringify(currentValue.sort())) {
          // Clear current selections and set new ones
          switch (key) {
            case 'selectedAmenities':
              currentValue.forEach((id) => dispatch(toggleAmenity(id))); // Remove existing
              pendingValue.forEach((id) => dispatch(toggleAmenity(id))); // Add new
              break;
            case 'selectedRecommended':
              currentValue.forEach((id) => dispatch(toggleRecommended(id)));
              pendingValue.forEach((id) => dispatch(toggleRecommended(id)));
              break;
            case 'selectedBookingOptions':
              currentValue.forEach((id) => dispatch(toggleBookingOption(id)));
              pendingValue.forEach((id) => dispatch(toggleBookingOption(id)));
              break;
            case 'selectedPropertyTypes':
              currentValue.forEach((id) => dispatch(togglePropertyType(id)));
              pendingValue.forEach((id) => dispatch(togglePropertyType(id)));
              break;
            case 'selectedAccessibilityFeatures':
              currentValue.forEach((id) => dispatch(toggleAccessibilityFeature(id)));
              pendingValue.forEach((id) => dispatch(toggleAccessibilityFeature(id)));
              break;
            case 'selectedHostLanguages':
              currentValue.forEach((id) => dispatch(toggleHostLanguage(id)));
              pendingValue.forEach((id) => dispatch(toggleHostLanguage(id)));
              break;
            case 'selectedStandoutStays':
              currentValue.forEach((id) => dispatch(toggleStandoutStay(id)));
              pendingValue.forEach((id) => dispatch(toggleStandoutStay(id)));
              break;
          }
        }
      }
    });

    // Simulate loading and update chart
    const timer = window.setTimeout(() => {
      setChartVariant((prev) => (prev + 1) % chartDataVariations.length);
      setIsLoading(false);
      // Close modal after applying changes
      setIsOpen(false);
    }, 700); // brief loading simulation

    loadingTimerRef.current = timer;
  };

  // Cleanup on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      if (calculatingTimerRef.current) {
        clearTimeout(calculatingTimerRef.current);
        calculatingTimerRef.current = null;
      }
      setIsLoading(false);
      setIsCalculating(false);
    };
  }, []);

  return (
    <div className="inline-flex items-center justify-center">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none border bg-white shadow-xs hover:bg-gray-50 hover:border-gray-400 px-6 py-3 border-gray-300">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </button>
        </DialogTrigger>

        <DialogContent
          hideCloseButton
          className="max-w-xl w-[85vw] h-[90vh] p-0 bg-white !rounded-3xl shadow-2xl flex flex-col z-[9999999]"
        >
          {/* Header */}
          <div className="items-center border-b-[1px] border-grey-light-50 justify-between flex w-full px-6 h-[3.9rem]">
            <div className="px-4" />
            <span className="font-semibold">Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center cursor-pointer hover:rounded-full hover:bg-grey-dim p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Recommended for you */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recommended for you</h3>
              <div className="grid grid-cols-4 gap-4">
                {recommendedOptions.map((option) => {
                  const isSelected = selectedRecommended.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleToggleRecommended(option.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors h-32 ${
                        isSelected
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={option.imageSrc || '/placeholder.svg'}
                        alt={option.label}
                        className="w-16 h-16 object-contain mb-2"
                      />
                      <span className="text-sm font-medium text-center">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Type of place */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Type of place</h3>
              <div className="border-2 border-gray-300 rounded-2xl p-1 flex">
                {['Any type', 'Room', 'Entire home'].map((type, index) => (
                  <div key={type} className="flex items-center flex-1">
                    <button
                      onClick={() => {
                        setPendingFilters((prev) => ({ ...prev, placeType: type as any }));
                        triggerCalculation();
                      }}
                      className={`flex-1 py-3 px-4 text-center rounded-xl transition-all ${
                        placeType === type
                          ? 'border-2 border-black text-black font-medium bg-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                    {index < 2 &&
                      placeType !== type &&
                      placeType !== ['Any type', 'Room', 'Entire home'][index + 1] && (
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                      )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Price range */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Price range</h3>
              <p className="text-sm text-gray-600 mb-3">Trip price, includes all fees</p>

              {/* Histogram with overlaid slider */}
              <div className="relative price-range-wrap">
                {/* Bars */}
                <div
                  className="grid items-end gap-[3px] h-24 pb-6"
                  style={{ gridTemplateColumns: `repeat(${BUCKETS}, minmax(0, 1fr))` }}
                >
                  {chartData.map((value, i) => {
                    const inRange = i >= minIndex && i <= maxIndex;
                    return (
                      <div
                        key={i}
                        className="rounded-[1px]"
                        style={{
                          height: `${value * 3}px`,
                          backgroundColor: inRange ? GRAPH_COLOR : OUT_RANGE_GRAY,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Slider baseline with exact styling */}
                <Slider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={1}
                  value={[minPrice, maxPrice]}
                  onValueChange={(vals) => {
                    const [lo, hi] = vals;
                    setPendingFilters((prev) => ({
                      ...prev,
                      minPrice: Math.max(PRICE_MIN, Math.min(lo, hi)),
                      maxPrice: Math.min(PRICE_MAX, Math.max(hi, lo)),
                    }));
                    triggerCalculation();
                  }}
                  className={[
                    'absolute left-0 right-0 bottom-[22px] z-10',
                    // Track (full width, thin, light background)
                    '[&>span:first-child]:h-[2px]',
                    '[&>span:first-child]:rounded-none',
                    '[&>span:first-child]:bg-transparent', // we set bg via style below
                    // Range (solid selected segment)
                    '[&>span:first-child>span]:rounded-none',
                    // Thumbs: single clean white circle with soft shadow (no inner border/ring)
                    '[&>span:nth-child(2)]:h-7 [&>span:nth-child(2)]:w-7 [&>span:nth-child(2)]:rounded-full',
                    '[&>span:nth-child(3)]:h-7 [&>span:nth-child(3)]:w-7 [&>span:nth-child(3)]:rounded-full',
                    '[&>span:nth-child(2)]:bg-white [&>span:nth-child(2)]:!border-0',
                    '[&>span:nth-child(2)]:!outline-none [&>span:nth-child(2)]:!ring-0 [&>span:nth-child(2)]:!ring-offset-0',
                    '[&>span:nth-child(3)]:bg-white [&>span:nth-child(3)]:!border-0',
                    '[&>span:nth-child(3)]:!outline-none [&>span:nth-child(3)]:!ring-0 [&>span:nth-child(3)]:!ring-offset-0',
                    '[&_[role=slider]]:!border-0',
                    '[&_[role=slider]]:!outline-none',
                    '[&_[role=slider]]:!ring-0',
                    '[&_[role=slider]]:!ring-offset-0',
                    '[&_[role=slider]]:!shadow-[0_6px_18px_rgba(0,0,0,0.15)]',
                    '[&_[role=slider]]:!transition-none',
                  ].join(' ')}
                  style={
                    {
                      // Apply colors via inline style to ensure exact hex
                      // Track background (full width, light)
                      // Radix structure: Root > Track (first span) > Range (span)
                      // We cannot target directly in style object, so we still set classes above and rely on CSS vars
                      // Use CSS variables to pass colors down and set them via data attributes
                      // next-lite supports inline style; instead, set CSS variables consumed below with attribute selectors
                      // Fallback: we directly set background on track and range via a tiny injected style tag below.
                    } as React.CSSProperties
                  }
                />
                {/* Inject exact colors onto track and range using a style tag scoped by sibling selector */}
                <style>{`
/* Track (full width, thin, light background) */
.price-range-wrap > span > span:first-child {
background: #e85f87;
height: 2px;
border-radius: 0;
}
/* Selected range (solid, exact hex) */
.price-range-wrap > span > span:first-child > span {
background: #e85f87;
border-radius: 0;
}

/* Thumbs (Radix puts role="slider" on thumbs) */
.price-range-wrap [role="slider"] {
width: 28px !important;
height: 28px !important;
background: #ffffff !important;
border: 0 !important;
outline: 0 !important;
border-radius: 9999px !important;
box-shadow: 0 6px 18px rgba(0,0,0,0.15) !important; /* soft drop shadow only */
transition: none !important;
--tw-ring-offset-shadow: 0 0 #0000 !important;
--tw-ring-shadow: 0 0 #0000 !important;
}
.price-range-wrap [role="slider"]:hover,
.price-range-wrap [role="slider"]:focus,
.price-range-wrap [role="slider"]:focus-visible,
.price-range-wrap [role="slider"]:active {
border: 0 !important;
outline: 0 !important;
box-shadow: 0 6px 18px rgba(0,0,0,0.15) !important; /* no gray glow */
background: #ffffff !important;
}
.price-range-wrap [role="slider"]::before,
.price-range-wrap [role="slider"]::after {
content: none !important;
display: none !important;
width: 0 !important;
height: 0 !important;
border: 0 !important;
box-shadow: none !important;
background: transparent !important;
}
`}</style>
              </div>

              {/* Min/Max inputs */}
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600">Minimum</label>
                  <Input
                    value={formatPrice(minPrice)}
                    onChange={onMinInput}
                    className="mt-2 h-10 w-[150px] rounded-full px-4 text-base text-center border-gray-300 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="text-right">
                  <label className="text-sm text-gray-600">Maximum</label>
                  <Input
                    value={formatPrice(maxPrice)}
                    onChange={onMaxInput}
                    className="mt-2 h-10 w-[150px] rounded-full px-4 text-base text-center border-gray-300 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 ml-auto"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rooms and beds */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Rooms and beds</h3>
              <div className="space-y-3">
                {[
                  { label: 'Bedrooms', value: bedrooms, type: 'bedrooms' as const },
                  { label: 'Beds', value: beds, type: 'beds' as const },
                  { label: 'Bathrooms', value: bathrooms, type: 'bathrooms' as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decrementValue(item.value, item.type)}
                        className="rounded-full w-8 h-8 p-0"
                        disabled={item.value === 'Any'}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.value}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => incrementValue(item.value, item.type)}
                        className="rounded-full w-8 h-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>

              <h4 className="font-medium mb-3">Popular</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => handleToggleAmenity('ac')}
                  aria-pressed={selectedAmenities.includes('ac')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('ac')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/air-conditioning-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Air conditioning</span>
                </button>

                <button
                  onClick={() => handleToggleAmenity('washer')}
                  aria-pressed={selectedAmenities.includes('washer')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('washer')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/washer-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Washer</span>
                </button>

                <button
                  onClick={() => handleToggleAmenity('wifi')}
                  aria-pressed={selectedAmenities.includes('wifi')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('wifi')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/wifi-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Wifi</span>
                </button>

                <button
                  onClick={() => handleToggleAmenity('kitchen')}
                  aria-pressed={selectedAmenities.includes('kitchen')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('kitchen')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/kitchen-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Kitchen</span>
                </button>

                <button
                  onClick={() => handleToggleAmenity('gym')}
                  aria-pressed={selectedAmenities.includes('gym')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('gym')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/gym-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Gym</span>
                </button>

                <button
                  onClick={() => handleToggleAmenity('pool')}
                  aria-pressed={selectedAmenities.includes('pool')}
                  className={[
                    'flex items-center gap-3 rounded-full border px-4 h-12',
                    'transition-colors',
                    selectedAmenities.includes('pool')
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400',
                  ].join(' ')}
                >
                  <img src="/images/pool-icon.svg" alt="" className="w-4 h-4" />
                  <span className="text-sm">Pool</span>
                </button>
              </div>

              <h4 className="font-medium mb-3">Essentials</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {amenityCategories.essentials.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id);

                  // Get the appropriate icon for each amenity
                  const getAmenityIcon = (id: string) => {
                    switch (id) {
                      case 'washer':
                        return (
                          <img
                            src="/images/essentials-washer-icon.svg"
                            alt=""
                            className="w-4 h-4"
                          />
                        );
                      case 'dryer':
                        return <img src="/images/dryer-icon.svg" alt="" className="w-4 h-4" />;
                      case 'heating':
                        return <img src="/images/heating-icon.svg" alt="" className="w-4 h-4" />;
                      case 'workspace':
                        return (
                          <img
                            src="/images/dedicated-workspace-icon.svg"
                            alt=""
                            className="w-4 h-4"
                          />
                        );
                      case 'hairdryer':
                        return <img src="/images/hair-dryer-icon.svg" alt="" className="w-4 h-4" />;
                      case 'iron':
                        return <img src="/images/iron-icon.svg" alt="" className="w-4 h-4" />;
                      default:
                        return null;
                    }
                  };

                  return (
                    <Button
                      key={amenity.id}
                      variant="outline"
                      onClick={() => handleToggleAmenity(amenity.id)}
                      className={`rounded-full px-4 py-2 h-auto flex items-center gap-2 ${
                        isSelected ? 'border-black bg-gray-50' : 'border-gray-300'
                      }`}
                    >
                      {getAmenityIcon(amenity.id)}
                      {amenity.label}
                    </Button>
                  );
                })}
              </div>

              <Collapsible open={showMoreAmenities} onOpenChange={setShowMoreAmenities}>
                <CollapsibleContent className="space-y-6">
                  <h4 className="font-medium mb-3">Features</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {amenityCategories.features.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      const iconSrc = getFeatureIcon(amenity.id);
                      return (
                        <Button
                          key={amenity.id}
                          variant="outline"
                          onClick={() => handleToggleAmenity(amenity.id)}
                          className={`rounded-full px-4 py-2 h-auto flex items-center gap-2 ${
                            isSelected ? 'border-black bg-gray-50' : 'border-gray-300'
                          }`}
                        >
                          {iconSrc && (
                            <img
                              src={iconSrc || '/placeholder.svg'}
                              alt={amenity.label}
                              className="w-4 h-4"
                            />
                          )}
                          {amenity.label}
                        </Button>
                      );
                    })}
                  </div>

                  <h4 className="font-medium mb-3">Location</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {amenityCategories.location.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <Button
                          key={amenity.id}
                          variant="outline"
                          onClick={() => handleToggleAmenity(amenity.id)}
                          className={`rounded-full px-4 py-2 h-auto flex items-center gap-2 ${
                            isSelected ? 'border-black bg-gray-50' : 'border-gray-300'
                          }`}
                        >
                          {amenity.id === 'waterfront' && (
                            <img src="/images/waterfront-icon.svg" alt="" className="w-4 h-4" />
                          )}
                          {amenity.id === 'skiinskiout' && (
                            <img src="/images/ski-in-out-icon.svg" alt="" className="w-4 h-4" />
                          )}
                          {amenity.label}
                        </Button>
                      );
                    })}
                  </div>

                  <h4 className="font-medium mb-3">Safety</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {amenityCategories.safety.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <Button
                          key={amenity.id}
                          variant="outline"
                          onClick={() => handleToggleAmenity(amenity.id)}
                          className={`rounded-full px-4 py-2 h-auto flex items-center gap-2 ${
                            isSelected ? 'border-black bg-gray-50' : 'border-gray-300'
                          }`}
                        >
                          {amenity.id === 'smokealarm' && (
                            <img src="/images/smoke-alarm-icon.svg" alt="" className="w-4 h-4" />
                          )}
                          {amenity.id === 'carbonmonoxidealarm' && (
                            <img
                              src="/images/carbon-monoxide-icon.svg"
                              alt=""
                              className="w-4 h-4"
                            />
                          )}
                          {amenity.label}
                        </Button>
                      );
                    })}
                  </div>
                </CollapsibleContent>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="mt-3 p-0 h-auto font-medium underline flex items-center"
                  >
                    {showMoreAmenities ? 'Show less' : 'Show more'}
                    <ChevronDown
                      className={`w-4 h-4 ml-1 transition-transform ${
                        showMoreAmenities ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <Separator />

            {/* Booking options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Booking options</h3>
              <div className="flex flex-wrap gap-3">
                {bookingOptions.map((option) => {
                  const isSelected = selectedBookingOptions.includes(option.id);
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      onClick={() => handleToggleBookingOption(option.id)}
                      className={`rounded-full px-4 py-2 h-auto flex items-center gap-2 ${
                        isSelected ? 'border-black bg-gray-50' : 'border-gray-300'
                      }`}
                    >
                      {option.id === 'instant' && (
                        <img src="/images/instant-book-icon.svg" alt="" className="w-4 h-4" />
                      )}
                      {option.id === 'selfcheckin' && (
                        <img
                          src="/images/location-self-checkin-icon.svg"
                          alt=""
                          className="w-4 h-4"
                        />
                      )}
                      {option.id === 'allowspets' && (
                        <img
                          src="/images/location-allows-pets-icon.svg"
                          alt=""
                          className="w-4 h-4"
                        />
                      )}
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Standout stays */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-3">Standout stays</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleToggleStandoutStay('guest-favorite')}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    selectedStandoutStays.includes('guest-favorite')
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex">
                    <img
                      src="/images/guests-favorite-icon.svg"
                      alt=""
                      className="w-8 h-8 mr-3 mt-1"
                    />
                    <div>
                      <div className="font-semibold mb-1">Guest favorite</div>
                      <p className="text-sm text-gray-600">The most loved homes on Airbnb</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleToggleStandoutStay('luxe')}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    selectedStandoutStays.includes('luxe')
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex">
                    <img src="/images/luxe-icon.svg" alt="" className="w-8 h-8 mr-3 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Luxe</div>
                      <p className="text-sm text-gray-600">Luxury homes with elevated design</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            <Collapsible open={isAccessibilityOpen} onOpenChange={setIsAccessibilityOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto text-lg font-semibold hover:bg-transparent"
                >
                  Accessibility features
                  {isAccessibilityOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 mt-4">
                <div>
                  <h4 className="font-medium mb-3">Guest entrance and parking</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'step-free-access', label: 'Step-free access' },
                      { id: 'disabled-parking-spot', label: 'Disabled parking spot' },
                      { id: 'guest-entrance-wider', label: 'Guest entrance wider than 32 inches' },
                    ].map((feature) => (
                      <div key={feature.id} className="flex items-center gap-3">
                        <Checkbox
                          id={feature.id}
                          checked={selectedAccessibilityFeatures.includes(feature.id)}
                          onCheckedChange={() => handleToggleAccessibilityFeature(feature.id)}
                          className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor={feature.id}
                          className="text-[16px] leading-5 font-normal tracking-normal"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Bedroom</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'step-free-bedroom-access', label: 'Step-free bedroom access' },
                      {
                        id: 'bedroom-entrance-wider',
                        label: 'Bedroom entrance wider than 32 inches',
                      },
                    ].map((feature) => (
                      <div key={feature.id} className="flex items-center gap-3">
                        <Checkbox
                          id={feature.id}
                          checked={selectedAccessibilityFeatures.includes(feature.id)}
                          onCheckedChange={() => handleToggleAccessibilityFeature(feature.id)}
                          className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor={feature.id}
                          className="text-[16px] leading-5 font-normal tracking-normal"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Bathroom</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'step-free-bathroom-access', label: 'Step-free bathroom access' },
                      {
                        id: 'bathroom-entrance-wider',
                        label: 'Bathroom entrance wider than 32 inches',
                      },
                      { id: 'toilet-grab-bar', label: 'Toilet grab bar' },
                      { id: 'shower-grab-bar', label: 'Shower grab bar' },
                      { id: 'step-free-shower', label: 'Step-free shower' },
                      { id: 'shower-bath-chair', label: 'Shower or bath chair' },
                    ].map((feature) => (
                      <div key={feature.id} className="flex items-center gap-3">
                        <Checkbox
                          id={feature.id}
                          checked={selectedAccessibilityFeatures.includes(feature.id)}
                          onCheckedChange={() => handleToggleAccessibilityFeature(feature.id)}
                          className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor={feature.id}
                          className="text-[16px] leading-5 font-normal tracking-normal"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Adaptive equipment</h4>
                  <div className="space-y-3">
                    {[{ id: 'ceiling-mobile-hoist', label: 'Ceiling or mobile hoist' }].map(
                      (feature) => (
                        <div key={feature.id} className="flex items-center gap-3">
                          <Checkbox
                            id={feature.id}
                            checked={selectedAccessibilityFeatures.includes(feature.id)}
                            onCheckedChange={() => handleToggleAccessibilityFeature(feature.id)}
                            className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor={feature.id}
                            className="text-[16px] leading-5 font-normal tracking-normal"
                          >
                            {feature.label}
                          </Label>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Host language */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Host language</h3>
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {/*
              Layout mirrors the accessibility section styling:
              - Same Checkbox component and className for size/border.
              - Two columns with vertical spacing.
            */}
                {(() => {
                  const left = [
                    { id: 'zh-cn', label: 'Chinese (Simplified)' },
                    { id: 'fr', label: 'French' },
                    { id: 'it', label: 'Italian' },
                    { id: 'ko', label: 'Korean' },
                    { id: 'ru', label: 'Russian' },
                    { id: 'ar', label: 'Arabic' },
                    { id: 'cs', label: 'Czech' },
                    { id: 'nl', label: 'Dutch' },
                    { id: 'el', label: 'Greek' },
                    { id: 'hi', label: 'Hindi' },
                    { id: 'is', label: 'Icelandic' },
                    { id: 'ms', label: 'Malay' },
                    { id: 'pl', label: 'Polish' },
                    { id: 'th', label: 'Thai' },
                    { id: 'af', label: 'Afrikaans' },
                    { id: 'az', label: 'Azerbaijani' },
                    { id: 'et', label: 'Estonian' },
                    { id: 'gl', label: 'Galician' },
                    { id: 'gu', label: 'Gujarati' },
                    { id: 'fa', label: 'Persian' },
                    { id: 'ro', label: 'Romanian' },
                    { id: 'tl', label: 'Tagalog' },
                    { id: 'uk', label: 'Ukrainian' },
                    { id: 'vi', label: 'Vietnamese' },
                    { id: 'zu', label: 'Zulu' },
                  ];
                  const right = [
                    { id: 'en', label: 'English' },
                    { id: 'de', label: 'German' },
                    { id: 'ja', label: 'Japanese' },
                    { id: 'pt', label: 'Portuguese' },
                    { id: 'es', label: 'Spanish' },
                    { id: 'hr', label: 'Croatian' },
                    { id: 'da', label: 'Danish' },
                    { id: 'fi', label: 'Finnish' },
                    { id: 'he', label: 'Hebrew' },
                    { id: 'hu', label: 'Hungarian' },
                    { id: 'id', label: 'Indonesian' },
                    { id: 'no', label: 'Norwegian' },
                    { id: 'sv', label: 'Swedish' },
                    { id: 'tr', label: 'Turkish' },
                    { id: 'hy', label: 'Armenian' },
                    { id: 'bn', label: 'Bengali' },
                    { id: 'fil', label: 'Filipino' },
                    { id: 'ka', label: 'Georgian' },
                    { id: 'ga', label: 'Irish' },
                    { id: 'pa', label: 'Punjabi' },
                    { id: 'sw', label: 'Swahili' },
                    { id: 'ta', label: 'Tamil' },
                    { id: 'ur', label: 'Urdu' },
                    { id: 'xh', label: 'Xhosa' },
                    { id: 'sign', label: 'Sign Language' },
                  ];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16">
                      <div className="space-y-4">
                        {left.map((lang) => {
                          const id = `lang-${lang.id}`;
                          const isChecked = selectedHostLanguages.includes(lang.id);
                          return (
                            <div key={lang.id} className="flex items-center gap-3">
                              <Checkbox
                                id={id}
                                checked={isChecked}
                                onCheckedChange={() => handleToggleHostLanguage(lang.id)}
                                className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                              />
                              <Label
                                htmlFor={id}
                                className="text-[16px] leading-5 font-normal tracking-normal"
                              >
                                {lang.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-4 mt-4 sm:mt-0">
                        {right.map((lang) => {
                          const id = `lang-${lang.id}`;
                          const isChecked = selectedHostLanguages.includes(lang.id);
                          return (
                            <div key={lang.id} className="flex items-center gap-3">
                              <Checkbox
                                id={id}
                                checked={isChecked}
                                onCheckedChange={() => handleToggleHostLanguage(lang.id)}
                                className="h-6 w-6 rounded-[4px] border border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                              />
                              <Label
                                htmlFor={id}
                                className="text-[16px] leading-5 font-normal tracking-normal"
                              >
                                {lang.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={clearAll}
                className="bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={handleShowPlaces}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors min-w-[160px] h-12 flex items-center justify-center"
                disabled={isLoading}
              >
                <div className="flex items-center justify-center min-h-[20px]">
                  {isLoading ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                  ) : isCalculating ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    formatSearchResultsText(pendingResultsCount)
                  )}
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
