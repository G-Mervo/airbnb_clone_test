import apiClient from './apiClient';

export interface LocationSuggestion {
  full: string;
  city: string;
  state: string;
  country: string;
  type: 'address' | 'city' | 'state' | 'country';
}

/**
 * Get location suggestions for typeahead search
 * @param query - Optional search query to filter locations
 * @returns Promise<LocationSuggestion[]>
 */
export const getLocationSuggestions = async (query?: string): Promise<LocationSuggestion[]> => {
  try {
    const params = query ? { query } : {};
    const response = await apiClient.get('/api/rooms/locations', params);
    return response;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    throw error;
  }
};

/**
 * React Query key factory for location suggestions
 */
export const locationKeys = {
  all: ['locations'] as const,
  suggestions: (query?: string) => [...locationKeys.all, 'suggestions', query] as const,
};