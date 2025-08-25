// Comprehensive filter utilities for properties based on all filter criteria

import { FilterState } from '../redux/filterSlice';

interface Property {
  id: string;
  city: string;
  state: string;
  country: string;
  'house-title': string;
  title_1?: string;
  price: number;

  // Property details
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  propertyType?: string;
  roomType?: string;

  // Location
  location?: {
    address: string;
    lat?: number;
    lng?: number;
  };

  // Guest capacity
  guestCapacity?: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
    serviceAnimals: boolean;
  };
  max_guests?: number;

  // Availability
  availability?: {
    minimumStay: number;
    maximumStay: number;
    checkInTime: string;
    checkOutTime: string;
    instantBook: boolean;
  };

  // Amenities
  amenities?: string[];
  wifi?: boolean;
  kitchen?: boolean;
  ac?: boolean;
  washer?: boolean;
  dryer?: boolean;
  pool?: boolean;
  gym?: boolean;
  parking?: boolean;
  tv?: boolean;
  heating?: boolean;
  workspace?: boolean;
  hairdryer?: boolean;
  iron?: boolean;

  // Features
  hottub?: boolean;
  evcharger?: boolean;
  crib?: boolean;
  kingbed?: boolean;
  bbqgrill?: boolean;
  breakfast?: boolean;
  fireplace?: boolean;
  smokingallowed?: boolean;
  waterfront?: boolean;
  skiinskiout?: boolean;

  // Safety
  smokealarm?: boolean;
  carbonmonoxidealarm?: boolean;

  // Booking options
  bookingOptions?: {
    instantBook: boolean;
    selfCheckin: boolean;
    allowsPets: boolean;
    smokingAllowed: boolean;
    eventsAllowed: boolean;
  };
  instantBook?: boolean;
  selfCheckin?: boolean;
  allowsPets?: boolean;

  // Host
  host?: {
    languages?: string[];
    isSuperhost?: boolean;
  };

  // Ratings
  house_rating?: number;
  rating?: number;
  isGuestFavorite?: boolean;
  is_new?: boolean;

  // Accessibility
  accessibilityFeatures?: string[];

  [key: string]: any;
}

/**
 * Filter properties by price range
 */
export function filterByPrice(
  properties: Property[],
  minPrice: number,
  maxPrice: number,
): Property[] {
  return properties.filter((property) => {
    const price = property.price || 0;
    return price >= minPrice && price <= maxPrice;
  });
}

/**
 * Filter properties by place type (room type)
 */
export function filterByPlaceType(properties: Property[], placeType: string): Property[] {
  if (placeType === 'Any type') return properties;

  return properties.filter((property) => {
    const roomType = property.roomType || '';

    switch (placeType) {
      case 'Entire home':
        return (
          roomType.toLowerCase().includes('entire') ||
          roomType.toLowerCase().includes('home') ||
          roomType.toLowerCase().includes('apartment')
        );
      case 'Room':
        return (
          roomType.toLowerCase().includes('room') || roomType.toLowerCase().includes('private')
        );
      default:
        return true;
    }
  });
}

/**
 * Filter properties by room counts (bedrooms, beds, bathrooms)
 */
export function filterByRoomCounts(
  properties: Property[],
  bedrooms: string,
  beds: string,
  bathrooms: string,
): Property[] {
  return properties.filter((property) => {
    // Check bedrooms
    if (bedrooms !== 'Any') {
      const bedroomCount = property.bedrooms || 0;
      const requiredBedrooms = parseInt(bedrooms);
      if (bedroomCount < requiredBedrooms) return false;
    }

    // Check beds
    if (beds !== 'Any') {
      const bedCount = property.beds || property.bedrooms || 1;
      const requiredBeds = parseInt(beds);
      if (bedCount < requiredBeds) return false;
    }

    // Check bathrooms
    if (bathrooms !== 'Any') {
      const bathroomCount = property.bathrooms || 1;
      const requiredBathrooms = parseInt(bathrooms);
      if (bathroomCount < requiredBathrooms) return false;
    }

    return true;
  });
}

/**
 * Filter properties by amenities
 */
export function filterByAmenities(properties: Property[], selectedAmenities: string[]): Property[] {
  if (selectedAmenities.length === 0) return properties;

  // Map amenity IDs to actual names in the data
  const amenityMap: { [key: string]: string[] } = {
    wifi: ['WiFi', 'wifi'],
    kitchen: ['Kitchen', 'kitchen'],
    ac: ['Air conditioning', 'ac', 'Air Conditioning'],
    washer: ['Washer', 'washer'],
    dryer: ['Dryer', 'dryer'],
    pool: ['Pool', 'pool'],
    gym: ['Gym', 'gym'],
    tv: ['TV', 'tv'],
    heating: ['Heating', 'heating'],
    workspace: ['Workspace', 'workspace', 'Dedicated workspace'],
    hairdryer: ['Hair dryer', 'hairdryer'],
    iron: ['Iron', 'iron'],
    hottub: ['Hot tub', 'hottub'],
    freeparking: ['Free parking', 'parking', 'Parking'],
    evcharger: ['EV charger', 'evcharger'],
    crib: ['Crib', 'crib'],
    kingbed: ['King bed', 'kingbed'],
    bbqgrill: ['BBQ grill', 'bbqgrill'],
    breakfast: ['Breakfast', 'breakfast'],
    fireplace: ['Indoor fireplace', 'fireplace'],
    smokingallowed: ['Smoking allowed', 'smokingallowed'],
    waterfront: ['Waterfront', 'waterfront'],
    skiinskiout: ['Ski-in/ski-out', 'skiinskiout'],
    smokealarm: ['Smoke alarm', 'smokealarm'],
    carbonmonoxidealarm: ['Carbon monoxide alarm', 'carbonmonoxidealarm'],
  };

  return properties.filter((property) => {
    return selectedAmenities.every((amenityId) => {
      const amenityNames = amenityMap[amenityId] || [amenityId];
      const propertyAmenities = property.amenities || [];

      // Check if any of the possible names for this amenity exists
      return (
        amenityNames.some((amenityName) =>
          propertyAmenities.some(
            (propAmenity) =>
              propAmenity.toLowerCase().includes(amenityName.toLowerCase()) ||
              amenityName.toLowerCase().includes(propAmenity.toLowerCase()),
          ),
        ) || property[amenityId as keyof Property] === true
      );
    });
  });
}

/**
 * Filter properties by recommended options
 */
export function filterByRecommended(
  properties: Property[],
  selectedRecommended: string[],
): Property[] {
  if (selectedRecommended.length === 0) return properties;

  return properties.filter((property) => {
    return selectedRecommended.every((recommended) => {
      switch (recommended) {
        case 'parking':
          return (
            property.parking === true ||
            (property.amenities && property.amenities.includes('parking'))
          );
        case 'pets':
          return (
            property.allowsPets === true ||
            (property.bookingOptions && property.bookingOptions.allowsPets)
          );
        case 'checkin':
          return (
            property.selfCheckin === true ||
            (property.bookingOptions && property.bookingOptions.selfCheckin)
          );
        case 'tv':
          return property.tv === true || (property.amenities && property.amenities.includes('tv'));
        default:
          return true;
      }
    });
  });
}

/**
 * Filter properties by booking options
 */
export function filterByBookingOptions(
  properties: Property[],
  selectedBookingOptions: string[],
): Property[] {
  if (selectedBookingOptions.length === 0) return properties;

  return properties.filter((property) => {
    return selectedBookingOptions.every((option) => {
      switch (option) {
        case 'instant':
          return (
            property.instantBook === true ||
            (property.bookingOptions && property.bookingOptions.instantBook) ||
            (property.availability && property.availability.instantBook)
          );
        case 'selfcheckin':
          return (
            property.selfCheckin === true ||
            (property.bookingOptions && property.bookingOptions.selfCheckin)
          );
        case 'allowspets':
          return (
            property.allowsPets === true ||
            (property.bookingOptions && property.bookingOptions.allowsPets)
          );
        default:
          return true;
      }
    });
  });
}

/**
 * Filter properties by property types
 */
export function filterByPropertyTypes(
  properties: Property[],
  selectedPropertyTypes: string[],
): Property[] {
  if (selectedPropertyTypes.length === 0) return properties;

  return properties.filter((property) => {
    const propertyType = (property.propertyType || '').toLowerCase();

    return selectedPropertyTypes.some((type) => {
      switch (type) {
        case 'house':
          return (
            propertyType === 'house' ||
            propertyType.includes('house') ||
            propertyType.includes('home')
          );
        case 'apartment':
          return (
            propertyType === 'apartment' ||
            propertyType.includes('apartment') ||
            propertyType.includes('condo')
          );
        case 'guesthouse':
          return (
            propertyType === 'guesthouse' ||
            propertyType.includes('guest') ||
            propertyType.includes('cottage')
          );
        case 'hotel':
          return (
            propertyType === 'hotel' ||
            propertyType.includes('hotel') ||
            propertyType.includes('resort')
          );
        default:
          return false;
      }
    });
  });
}

/**
 * Filter properties by accessibility features
 */
export function filterByAccessibilityFeatures(
  properties: Property[],
  selectedAccessibilityFeatures: string[],
): Property[] {
  if (selectedAccessibilityFeatures.length === 0) return properties;

  return properties.filter((property) => {
    const accessibilityFeatures = property.accessibilityFeatures || [];

    return selectedAccessibilityFeatures.every((feature) => {
      return (
        accessibilityFeatures.includes(feature) ||
        (property.amenities && property.amenities.includes(feature))
      );
    });
  });
}

/**
 * Filter properties by host languages
 */
export function filterByHostLanguages(
  properties: Property[],
  selectedHostLanguages: string[],
): Property[] {
  if (selectedHostLanguages.length === 0) return properties;

  return properties.filter((property) => {
    const hostLanguages = property.host?.languages || [];

    return selectedHostLanguages.some((language) => {
      return hostLanguages.includes(language);
    });
  });
}

/**
 * Filter properties by standout stays
 */
export function filterByStandoutStays(
  properties: Property[],
  selectedStandoutStays: string[],
): Property[] {
  if (selectedStandoutStays.length === 0) return properties;

  return properties.filter((property) => {
    return selectedStandoutStays.every((stay) => {
      switch (stay) {
        case 'guest-favorite':
          const rating = property.house_rating || property.rating || 0;
          return property.isGuestFavorite === true || rating >= 4.9;
        case 'luxe':
          // Assuming luxe properties have higher prices and ratings
          const price = property.price || 0;
          const luxeRating = property.house_rating || property.rating || 0;
          return price >= 300 && luxeRating >= 4.8;
        default:
          return true;
      }
    });
  });
}

/**
 * Main comprehensive filter function that applies all filters
 */
export function applyAllFilters(properties: Property[], filters: FilterState): Property[] {
  let filtered = [...properties];

  // Apply price filter
  filtered = filterByPrice(filtered, filters.minPrice, filters.maxPrice);

  // Apply place type filter
  filtered = filterByPlaceType(filtered, filters.placeType);

  // Apply room counts filter
  filtered = filterByRoomCounts(filtered, filters.bedrooms, filters.beds, filters.bathrooms);

  // Apply amenities filter
  filtered = filterByAmenities(filtered, filters.selectedAmenities);

  // Apply recommended options filter
  filtered = filterByRecommended(filtered, filters.selectedRecommended);

  // Apply booking options filter
  filtered = filterByBookingOptions(filtered, filters.selectedBookingOptions);

  // Apply property types filter
  filtered = filterByPropertyTypes(filtered, filters.selectedPropertyTypes);

  // Apply accessibility features filter
  filtered = filterByAccessibilityFeatures(filtered, filters.selectedAccessibilityFeatures);

  // Apply host languages filter
  filtered = filterByHostLanguages(filtered, filters.selectedHostLanguages);

  // Apply standout stays filter
  filtered = filterByStandoutStays(filtered, filters.selectedStandoutStays);

  return filtered;
}

/**
 * Helper to check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.minPrice !== 0 ||
    filters.maxPrice !== 800 ||
    filters.placeType !== 'Any type' ||
    filters.bedrooms !== 'Any' ||
    filters.beds !== 'Any' ||
    filters.bathrooms !== 'Any' ||
    filters.selectedAmenities.length > 0 ||
    filters.selectedRecommended.length > 0 ||
    filters.selectedBookingOptions.length > 0 ||
    filters.selectedPropertyTypes.length > 0 ||
    filters.selectedAccessibilityFeatures.length > 0 ||
    filters.selectedHostLanguages.length > 0 ||
    filters.selectedStandoutStays.length > 0 ||
    filters.adults > 0 ||
    filters.startDate !== '' ||
    filters.endDate !== ''
  );
}

/**
 * Helper to count active filters
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;

  if (filters.minPrice !== 0 || filters.maxPrice !== 800) count++;
  if (filters.placeType !== 'Any type') count++;
  if (filters.bedrooms !== 'Any' || filters.beds !== 'Any' || filters.bathrooms !== 'Any') count++;
  if (filters.selectedAmenities.length > 0) count++;
  if (filters.selectedRecommended.length > 0) count++;
  if (filters.selectedBookingOptions.length > 0) count++;
  if (filters.selectedPropertyTypes.length > 0) count++;
  if (filters.selectedAccessibilityFeatures.length > 0) count++;
  if (filters.selectedHostLanguages.length > 0) count++;
  if (filters.selectedStandoutStays.length > 0) count++;

  return count;
}
