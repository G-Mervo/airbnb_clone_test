// Search utilities for filtering properties based on user criteria

export interface SearchFilters {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  // Add flexible search criteria
  flexibleMonths?: number[];
  stayDuration?: string;
  dateOption?: string;
  // Add month mode specific criteria
  monthDuration?: number;
  startDurationDate?: Date | null;
  dateFlexibility?: string;
  startDateFlexibility?: string;
  endDateFlexibility?: string;
}

interface Property {
  id: string;
  city: string;
  state: string;
  country: string;
  'house-title': string;
  title_1?: string;
  location?: {
    address: string;
  };
  availability?: {
    minimumStay: number;
    maximumStay: number;
    checkInTime: string;
    checkOutTime: string;
    instantBook: boolean;
  };
  guestCapacity?: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
    serviceAnimals: boolean;
  };
  [key: string]: any;
}

/**
 * Filters properties based on location search
 */
export function filterByLocation(properties: Property[], location: string): Property[] {
  if (!location || location.trim() === '') return properties;

  const searchTerm = location.toLowerCase().trim();

  return properties.filter((property) => {
    // Check city, state, and combined city + state
    const city = property.city?.toLowerCase() || '';
    const state = property.state?.toLowerCase() || '';
    const country = property.country?.toLowerCase() || '';
    const address = property.location?.address?.toLowerCase() || '';
    const title = property['house-title']?.toLowerCase() || '';

    // Match exact city name or "City, State" format
    const cityStateMatch = `${city}, ${state}`;
    const cityCountryMatch = `${city}, ${country}`;

    return (
      city.includes(searchTerm) ||
      state.includes(searchTerm) ||
      cityStateMatch.includes(searchTerm) ||
      cityCountryMatch.includes(searchTerm) ||
      address.includes(searchTerm) ||
      title.includes(searchTerm) ||
      // Handle cases like "Virginia Beach, VA" vs "Virginia Beach"
      searchTerm.includes(city) ||
      // Handle state abbreviations
      (searchTerm.includes('va') && state === 'va') ||
      (searchTerm.includes('fl') && state === 'fl') ||
      (searchTerm.includes('nc') && state === 'nc') ||
      (searchTerm.includes('sc') && state === 'sc') ||
      (searchTerm.includes('tn') && state === 'tn') ||
      (searchTerm.includes('pa') && state === 'pa') ||
      (searchTerm.includes('ny') && state === 'ny') ||
      (searchTerm.includes('md') && state === 'md') ||
      (searchTerm.includes('pr') && state === 'pr')
    );
  });
}

/**
 * Filters properties based on date availability
 */
export function filterByDates(
  properties: Property[],
  startDate: Date | null,
  endDate: Date | null,
): Property[] {
  if (!startDate || !endDate) return properties;

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return properties.filter((property) => {
    const availability = property.availability;
    if (!availability) return true; // If no availability info, assume available

    // Check minimum and maximum stay requirements
    const minStay = availability.minimumStay || 1;
    const maxStay = availability.maximumStay || 365;

    return daysDiff >= minStay && daysDiff <= maxStay;
  });
}

/**
 * Filters properties based on guest capacity requirements
 */
export function filterByGuestCapacity(
  properties: Property[],
  adults: number = 0,
  children: number = 0,
  infants: number = 0,
  pets: number = 0,
): Property[] {
  if (adults === 0 && children === 0 && infants === 0 && pets === 0) {
    return properties;
  }

  return properties.filter((property) => {
    const capacity = property.guestCapacity || property;

    // Check adults capacity (required)
    const maxAdults = capacity.adults || (capacity as any).max_guests || 0;
    if (adults > maxAdults) return false;

    // Check children capacity
    const maxChildren = capacity.children || 0;
    if (children > maxChildren) return false;

    // Check infants capacity
    const maxInfants = capacity.infants || 0;
    if (infants > maxInfants) return false;

    // Check pets capacity
    const maxPets = capacity.pets || 0;
    const allowsServiceAnimals = capacity.serviceAnimals || false;

    // If they have pets but property doesn't allow any pets and no service animals
    if (pets > 0 && maxPets === 0 && !allowsServiceAnimals) return false;

    // If they have more pets than allowed (excluding service animals)
    if (pets > maxPets && !allowsServiceAnimals) return false;

    return true;
  });
}

/**
 * Main search function that applies all filters
 */
export function searchProperties(properties: Property[], filters: SearchFilters): Property[] {
  let filtered = [...properties];

  // Apply location filter
  if (filters.location) {
    filtered = filterByLocation(filtered, filters.location);
  }

  // Apply date filter
  if (filters.startDate && filters.endDate) {
    filtered = filterByDates(filtered, filters.startDate, filters.endDate);
  }

  // Apply guest capacity filter
  filtered = filterByGuestCapacity(
    filtered,
    filters.adults,
    filters.children,
    filters.infants,
    filters.pets,
  );

  return filtered;
}

/**
 * Helper function to extract search criteria from Redux state
 */
export function extractSearchFilters(mainFormState: any): SearchFilters {
  // Handle case where mainFormState might be undefined
  if (!mainFormState) {
    return {
      location: '',
      startDate: null,
      endDate: null,
      adults: 0,
      children: 0,
      infants: 0,
      pets: 0,
    };
  }

  // Handle different date modes
  let startDate = null;
  let endDate = null;

  if (mainFormState.dateOption === 'month') {
    // For month mode, prefer calendar-selected dates, fallback to circular slider dates
    if (mainFormState.selectedStartDate && mainFormState.selectedEndDate) {
      startDate = new Date(mainFormState.selectedStartDate);
      endDate = new Date(mainFormState.selectedEndDate);
    } else if (mainFormState.startDurationDate && mainFormState.curDot) {
      // Calculate end date from circular slider: startDurationDate + curDot months
      startDate = new Date(mainFormState.startDurationDate);
      const monthsToAdd = mainFormState.curDot === 0 ? 12 : mainFormState.curDot;
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);
    }
  } else {
    // For 'dates' and 'flexible' modes, use the standard selected dates
    startDate = mainFormState.selectedStartDate ? new Date(mainFormState.selectedStartDate) : null;
    endDate = mainFormState.selectedEndDate ? new Date(mainFormState.selectedEndDate) : null;
  }

  return {
    location: mainFormState.destinationInputVal || '',
    startDate,
    endDate,
    adults: mainFormState.adultCount || 0,
    children: mainFormState.childCount || 0,
    infants: mainFormState.infantCount || 0,
    pets: mainFormState.petsCount || 0,
    // Add flexible search criteria
    flexibleMonths: mainFormState.months || [],
    stayDuration: mainFormState.stayDuration || '',
    dateOption: mainFormState.dateOption || '',
    // Add month mode specific criteria
    monthDuration: mainFormState.curDot || 0,
    startDurationDate: mainFormState.startDurationDate
      ? new Date(mainFormState.startDurationDate)
      : null,
    dateFlexibility: mainFormState.dateFlexibility || 'exact',
    startDateFlexibility:
      mainFormState.startDateFlexibility || mainFormState.dateFlexibility || 'exact',
    endDateFlexibility:
      mainFormState.endDateFlexibility || mainFormState.dateFlexibility || 'exact',
  };
}

/**
 * Helper to format search results summary
 */
export function formatSearchSummary(filters: SearchFilters, resultsCount: number): string {
  const parts = [];

  if (filters.location) {
    parts.push(`in ${filters.location}`);
  }

  if (filters.startDate && filters.endDate) {
    const startStr = filters.startDate.toLocaleDateString();
    const endStr = filters.endDate.toLocaleDateString();
    parts.push(`${startStr} - ${endStr}`);
  }

  const totalGuests = (filters.adults || 0) + (filters.children || 0) + (filters.infants || 0);
  if (totalGuests > 0) {
    const guestText = totalGuests === 1 ? 'guest' : 'guests';
    parts.push(`${totalGuests} ${guestText}`);
  }

  if (filters.pets && filters.pets > 0) {
    const petText = filters.pets === 1 ? 'pet' : 'pets';
    parts.push(`${filters.pets} ${petText}`);
  }

  const summary = parts.length > 0 ? parts.join(' • ') : 'All properties';
  return `${resultsCount} properties ${summary}`;
}
