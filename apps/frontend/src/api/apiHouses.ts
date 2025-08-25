/**
 * Houses API Client
 *
 * Handles operations related to houses (physical properties)
 * - House listings and details
 * - House search and filtering
 * - Host's properties
 */

import api from './apiClient';

// House Type Definitions
export interface House {
  id: number;
  title: string;
  description?: string;
  property_type: string; // "House", "Apartment", "Condo", "Villa"
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  amenities: string[]; // Property-level amenities (Pool, Gym, etc.)
  house_rules?: string;
  cancellation_policy: string;
  check_in_time: string;
  check_out_time: string;
  minimum_stay: number;
  maximum_stay?: number;
  is_instant_bookable: boolean;
  host_id: number;
  is_active: boolean;
  images: string[]; // Main property images
  created_at: string;
  updated_at?: string;

  // Additional computed fields
  total_rooms?: number;
  host?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    is_verified?: boolean;
  };
}

export interface HouseFilter {
  city?: string;
  state?: string;
  country?: string;
  property_type?: string;
  min_rooms?: number;
  max_rooms?: number;
  amenities?: string[];
  host_id?: number;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

const housesService = {
  /**
   * Get all houses with optional filters
   */
  getHouses: async (filters?: HouseFilter): Promise<House[]> => {
    try {
      return await api.get('/api/houses', filters);
    } catch (error) {
      console.error('Error fetching houses:', error);
      throw error;
    }
  },

  /**
   * Get house by ID
   */
  getHouseById: async (id: number | string): Promise<House> => {
    try {
      return await api.get(`/api/houses/${id}`);
    } catch (error) {
      console.error(`Error fetching house ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get houses by host ID
   */
  getHousesByHost: async (hostId: number): Promise<House[]> => {
    try {
      return await api.get(`/api/houses/host/${hostId}`);
    } catch (error) {
      console.error(`Error fetching houses for host ${hostId}:`, error);
      throw error;
    }
  },

  /**
   * Search houses by location or text
   */
  searchHouses: async (query: string, filters?: HouseFilter): Promise<House[]> => {
    try {
      const searchParams = {
        ...filters,
        location: query,
      };
      return await api.get('/api/houses/search', searchParams);
    } catch (error) {
      console.error('Error searching houses:', error);
      throw error;
    }
  },

  /**
   * Get houses by property type
   */
  getHousesByType: async (propertyType: string, limit?: number): Promise<House[]> => {
    try {
      return await api.get('/api/houses', {
        property_type: propertyType,
        limit: limit || 20,
      });
    } catch (error) {
      console.error(`Error fetching houses by type ${propertyType}:`, error);
      throw error;
    }
  },

  /**
   * Create a new house
   */
  createHouse: async (houseData: Partial<House>): Promise<House> => {
    try {
      return await api.post('/api/houses', houseData);
    } catch (error) {
      console.error('Error creating house:', error);
      throw error;
    }
  },

  /**
   * Update a house
   */
  updateHouse: async (id: number, houseData: Partial<House>): Promise<House> => {
    try {
      return await api.put(`/api/houses/${id}`, houseData);
    } catch (error) {
      console.error(`Error updating house ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a house
   */
  deleteHouse: async (id: number): Promise<void> => {
    try {
      return await api.delete(`/api/houses/${id}`);
    } catch (error) {
      console.error(`Error deleting house ${id}:`, error);
      throw error;
    }
  },
};

export default housesService;
