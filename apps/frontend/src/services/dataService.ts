import {
  Room,
  Booking,
  Favorite,
  Payment,
  PaginatedResponse,
  RoomFilters,
  PaginationParams,
} from '../types';
import { safeValidateRooms, safeValidateRoom } from '../types/validation';

// Static imports for fallback data (Vite can analyze these)
import roomsData from '../data/mock-v2/rooms.json';
import bookingsData from '../data/mock-v2/bookings.json';
import favoritesData from '../data/mock-v2/favorites.json';
import paymentsData from '../data/mock-v2/payments.json';

/**
 * Data Service - handles dynamic JSON data loading with proper error handling and validation
 */
class DataService {
  private roomsCache: Room[] | null = null;
  private bookingsCache: Booking[] | null = null;
  private favoritesCache: Favorite[] | null = null;
  private paymentsCache: Payment[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Dynamically loads JSON data from public directory or API endpoint
   */
  private async loadJsonData<T>(path: string, fallbackData?: T[]): Promise<T[]> {
    try {
      // Try to fetch from public directory first (for dynamic loading)
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Data is not an array');
      }

      return data;
    } catch (error) {
      console.warn(`Failed to load data from ${path}:`, error);

      // Fallback to static import if dynamic loading fails
      if (fallbackData) {
        console.log(`Using fallback data for ${path}`);
        return fallbackData;
      }

      // Last resort: use static imports (Vite compatible)
      try {
        const filename = path.split('/').pop();
        console.log(`Using static fallback for: ${filename}`);

        switch (filename) {
          case 'rooms.json':
            return roomsData as T[];
          case 'bookings.json':
            return bookingsData as T[];
          case 'favorites.json':
            return favoritesData as T[];
          case 'payments.json':
            return paymentsData as T[];
          default:
            throw new Error(`No static fallback available for ${filename}`);
        }
      } catch (staticError) {
        console.error(`Failed to load static fallback data for ${path}:`, staticError);
        return [];
      }
    }
  }

  /**
   * Public method to load any JSON data from public directory
   */
  async loadPublicJsonData<T>(path: string): Promise<T> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to load JSON data from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Load and validate rooms data
   */
  async getRoomsData(forceRefresh: boolean = false): Promise<Room[]> {
    const now = Date.now();

    if (!forceRefresh && this.roomsCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.roomsCache;
    }

    try {
      // Check if we should use API
      const dataSource = import.meta.env.VITE_DATA_SOURCE;

      if (dataSource === 'api') {
        // Use API client to fetch from backend
        const { api } = await import('../api/apiClient');
        console.log('Loading rooms data from API...');
        const apiData = await api.get('/api/rooms/', { limit: 0 });

        if (Array.isArray(apiData)) {
          this.roomsCache = apiData as Room[];
          this.cacheTimestamp = now;
          console.log(`Loaded ${apiData.length} rooms from API`);
          return this.roomsCache;
        }
      }

      // Fallback to local JSON files (development only)
      console.log('Falling back to local JSON data...');
      const rawData = await this.loadJsonData<Room>('/data/rooms.json');
      const validatedData = safeValidateRooms(rawData);

      if (!validatedData) {
        console.warn('Room data validation failed, using raw data');
        this.roomsCache = rawData as Room[];
      } else {
        this.roomsCache = validatedData;
      }

      this.cacheTimestamp = now;
      return this.roomsCache || [];
    } catch (error) {
      console.error('Failed to load rooms data:', error);

      // Last resort: use static fallback data
      try {
        console.log('Using static fallback data...');
        this.roomsCache = roomsData as Room[];
        return this.roomsCache;
      } catch (fallbackError) {
        console.error('Failed to load static fallback:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Load bookings data
   */
  async getBookingsData(forceRefresh: boolean = false): Promise<Booking[]> {
    const now = Date.now();

    if (!forceRefresh && this.bookingsCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.bookingsCache;
    }

    try {
      this.bookingsCache = await this.loadJsonData<Booking>('/data/bookings.json');
      return this.bookingsCache;
    } catch (error) {
      console.error('Failed to load bookings data:', error);
      return [];
    }
  }

  /**
   * Load favorites data
   */
  async getFavoritesData(forceRefresh: boolean = false): Promise<Favorite[]> {
    const now = Date.now();

    if (!forceRefresh && this.favoritesCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.favoritesCache;
    }

    try {
      this.favoritesCache = await this.loadJsonData<Favorite>('/data/favorites.json');
      return this.favoritesCache;
    } catch (error) {
      console.error('Failed to load favorites data:', error);
      return [];
    }
  }

  /**
   * Load payments data
   */
  async getPaymentsData(forceRefresh: boolean = false): Promise<Payment[]> {
    const now = Date.now();

    if (!forceRefresh && this.paymentsCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.paymentsCache;
    }

    try {
      this.paymentsCache = await this.loadJsonData<Payment>('/data/payments.json');
      return this.paymentsCache;
    } catch (error) {
      console.error('Failed to load payments data:', error);
      return [];
    }
  }

  /**
   * Get a single room by ID
   */
  async getRoomById(id: string): Promise<Room | null> {
    const rooms = await this.getRoomsData();
    const room = rooms.find((room) => room.id === id) || null;

    if (room) {
      const validatedRoom = safeValidateRoom(room);
      return validatedRoom || (room as Room);
    }

    return null;
  }

  /**
   * Get filtered rooms with pagination
   */
  async getFilteredRooms(
    filters: RoomFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<Room>> {
    try {
      const rooms = await this.getRoomsData();
      let filteredRooms = [...rooms];

      // Apply filters
      if (filters.ids && filters.ids.length > 0) {
        filteredRooms = filteredRooms.filter((room) => filters.ids!.includes(room.id));
      }

      if (filters.country) {
        const pattern = new RegExp(filters.country, 'i');
        filteredRooms = filteredRooms.filter((room) => pattern.test(room.country));
      }

      if (filters.city) {
        const pattern = new RegExp(filters.city, 'i');
        filteredRooms = filteredRooms.filter((room) => pattern.test(room.city));
      }

      if (filters.filter) {
        const pattern = new RegExp(filters.filter, 'i');
        filteredRooms = filteredRooms.filter((room) => pattern.test(room.filter || ''));
      }

      if (filters.minPrice) {
        filteredRooms = filteredRooms.filter((room) => room.price >= filters.minPrice!);
      }

      if (filters.maxPrice) {
        filteredRooms = filteredRooms.filter((room) => room.price <= filters.maxPrice!);
      }

      if (filters.guests) {
        filteredRooms = filteredRooms.filter((room) => room.max_guests >= filters.guests!);
      }

      if (filters.bedrooms) {
        filteredRooms = filteredRooms.filter((room) => room.bedrooms >= filters.bedrooms!);
      }

      if (filters.amenities && filters.amenities.length > 0) {
        filteredRooms = filteredRooms.filter((room) =>
          filters.amenities!.every((amenity) =>
            room.amenities.some((roomAmenity) =>
              roomAmenity.toLowerCase().includes(amenity.toLowerCase()),
            ),
          ),
        );
      }

      if (filters.propertyType) {
        filteredRooms = filteredRooms.filter(
          (room) => room.propertyType.toLowerCase() === filters.propertyType!.toLowerCase(),
        );
      }

      if (filters.instantBook) {
        filteredRooms = filteredRooms.filter((room) => room.instant_book === true);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = pagination.offset || (page - 1) * limit;

      const total = filteredRooms.length;
      const paginatedRooms = filteredRooms.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return {
        data: paginatedRooms,
        success: true,
        meta: {
          total,
          page,
          limit,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error filtering rooms:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
        },
      };
    }
  }

  /**
   * Get user's favorite rooms
   */
  async getUserFavorites(userIds: string[]): Promise<Room[]> {
    if (!userIds || userIds.length === 0) return [];

    try {
      const rooms = await this.getRoomsData();
      const idSet = new Set(userIds.map((id) => String(id)));
      return rooms.filter((room) => idSet.has(String(room.id)));
    } catch (error) {
      console.error('Error getting user favorites:', error);
      return [];
    }
  }

  /**
   * Search rooms by text query
   */
  async searchRooms(query: string, limit: number = 20): Promise<Room[]> {
    if (!query.trim()) return [];

    try {
      const rooms = await this.getRoomsData();
      const searchTerm = query.toLowerCase();

      return rooms
        .filter((room) => {
          const searchableText = [
            room['house-title'],
            room.title_1,
            room.city,
            room.country,
            room.description,
            room.filter,
            room.propertyType,
            ...room.amenities,
          ]
            .join(' ')
            .toLowerCase();

          return searchableText.includes(searchTerm);
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching rooms:', error);
      return [];
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.roomsCache = null;
    this.bookingsCache = null;
    this.favoritesCache = null;
    this.paymentsCache = null;
    this.cacheTimestamp = 0;
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
