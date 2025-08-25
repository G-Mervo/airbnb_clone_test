/**
 * Rooms API Client
 *
 * Handles operations related to rooms (bookable units) with proper TypeScript patterns
 * - Type-safe room operations
 * - Consistent error handling
 * - Proper input validation
 * - Clean API design
 */

import api from './apiClient';

// === ENUMS FOR TYPE SAFETY ===
export enum RoomType {
  PRIVATE_ROOM = 'Private room',
  SHARED_ROOM = 'Shared room',
  ENTIRE_PLACE = 'Entire place',
}

export enum PropertyType {
  HOUSE = 'House',
  APARTMENT = 'Apartment',
  CONDO = 'Condo',
  VILLA = 'Villa',
  CABIN = 'Cabin',
  LOFT = 'Loft',
}

export enum CancellationPolicy {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  SUPER_STRICT = 'super_strict',
}

// === CORE INTERFACES ===
export interface Host {
  readonly id: number;
  readonly first_name: string;
  readonly last_name: string;
  readonly profile_picture?: string;
  readonly is_verified: boolean;
}

export interface RoomLocation {
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly postal_code?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface RoomPricing {
  readonly base_price: number;
  readonly cleaning_fee: number;
  readonly service_fee: number;
  readonly security_deposit: number;
}

export interface RoomCapacity {
  readonly max_guests: number;
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly beds: number;
}

export interface Room {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly property_type: PropertyType;
  readonly room_type: RoomType;
  readonly house_id: number;
  readonly host_id: number;
  readonly is_active: boolean;
  readonly is_instant_bookable: boolean;
  readonly amenities: readonly string[];
  readonly images: readonly string[];
  readonly house_rules?: string;
  readonly cancellation_policy: CancellationPolicy;
  readonly check_in_time: string;
  readonly check_out_time: string;
  readonly created_at: string;
  readonly updated_at?: string;

  // Embedded objects
  readonly location: RoomLocation;
  readonly pricing: RoomPricing;
  readonly capacity: RoomCapacity;
  readonly host?: Host;

  // Computed/display fields
  readonly average_rating?: number;
  readonly total_reviews?: number;
  readonly total_bookings?: number;
  readonly is_new?: boolean;
  readonly is_guest_favorite?: boolean;
  readonly filter?: string;
  readonly section?: number;
}

// Backward compatibility - PropertyDetail is now just an alias for Room
export type PropertyDetail = Room;

// === FILTER AND REQUEST INTERFACES ===
export interface RoomSearchFilters {
  // Location filtering
  readonly location?: string;
  readonly country?: string;
  readonly city?: string;
  readonly filter?: string;
  // Date filtering
  readonly check_in?: string; // ISO date string
  readonly check_out?: string; // ISO date string
  // Guest capacity filtering (detailed breakdown)
  readonly guests?: number; // Total guests (fallback)
  readonly adults?: number;
  readonly children?: number;
  readonly infants?: number;
  readonly pets?: number;
  // Property filtering
  readonly property_type?: PropertyType;
  readonly room_type?: RoomType;
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly instant_bookable?: boolean;
  readonly amenities?: readonly string[];
  // Price filtering
  readonly min_price?: number;
  readonly max_price?: number;
  // Other parameters
  readonly house_id?: number;
  // Optional map bounds for map-based searching
  readonly bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  // Flexible search parameters
  readonly flexible_months?: number[];
  readonly stay_duration?: string;
  readonly date_option?: string;
  // Month mode specific parameters
  readonly month_duration?: number;
  readonly start_duration_date?: string; // ISO date string
  readonly date_flexibility?: string;
  readonly start_date_flexibility?: string;
  readonly end_date_flexibility?: string;
  // Additional availability filters
  readonly min_stay_days?: number;
  readonly max_stay_days?: number;
}

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface RoomFilters extends RoomSearchFilters, PaginationParams {
  readonly ids?: readonly (string | number)[];
}

export interface RequestOptions {
  readonly signal?: AbortSignal | null;
}

// === RESPONSE INTERFACES ===
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly success: boolean;
  readonly error?: ApiError;
  readonly timestamp: string;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly success: boolean;
  readonly error?: ApiError;
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly hasMore: boolean;
    readonly totalPages: number;
  };
  readonly timestamp: string;
}

export interface RoomFilter {
  readonly filter: string;
  readonly iconName: string;
  readonly iconPath: string;
  readonly count?: number;
}

// === CUSTOM ERRORS ===
export class RoomApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RoomApiError';
  }
}

export class RoomNotFoundError extends RoomApiError {
  constructor(roomId: string | number) {
    super(`Room with ID ${roomId} not found`, 'ROOM_NOT_FOUND', 404);
  }
}

export class InvalidRoomDataError extends RoomApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_ROOM_DATA', 400, details);
  }
}

// === INPUT VALIDATION ===
const validateRoomId = (id: string | number): number => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId) || numericId <= 0) {
    throw new InvalidRoomDataError(`Invalid room ID: ${id}`);
  }
  return numericId;
};

const validateFilters = (filters: RoomFilters): RoomFilters => {
  const validated: RoomFilters = { ...filters };

  if (validated.min_price !== undefined && validated.min_price < 0) {
    throw new InvalidRoomDataError('min_price must be non-negative');
  }

  if (validated.max_price !== undefined && validated.max_price < 0) {
    throw new InvalidRoomDataError('max_price must be non-negative');
  }

  if (validated.min_price && validated.max_price && validated.min_price > validated.max_price) {
    throw new InvalidRoomDataError('min_price cannot be greater than max_price');
  }

  if (validated.guests !== undefined && validated.guests <= 0) {
    throw new InvalidRoomDataError('guests must be positive');
  }

  if (validated.page !== undefined && validated.page <= 0) {
    throw new InvalidRoomDataError('page must be positive');
  }

  if (validated.limit !== undefined && (validated.limit < 0 || validated.limit > 100)) {
    throw new InvalidRoomDataError('limit must be between 0 and 100');
  }

  return validated;
};

// === ERROR HANDLING HELPER ===
const handleApiError = (error: unknown, context: string): never => {
  if (error instanceof RoomApiError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new RoomApiError(`${context}: ${error.message}`, 'API_ERROR', undefined, {
      originalError: error.message,
    });
  }

  throw new RoomApiError(`${context}: Unknown error occurred`, 'UNKNOWN_ERROR', undefined, {
    originalError: String(error),
  });
};

// === MAIN SERVICE CLASS ===
class RoomsApiService {
  /**
   * Get all rooms with optional filters
   */
  async getRooms(filters: RoomFilters = {}): Promise<Room[]> {
    try {
      const validatedFilters = validateFilters(filters);
      const response = await api.get('/api/rooms', validatedFilters);
      return response;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch rooms');
    }
  }

  /**
   * Get room by ID with proper error handling
   */
  async getRoomById(id: string | number): Promise<Room> {
    try {
      const validatedId = validateRoomId(id);
      const response = await api.get(`/api/rooms/${validatedId}`);
      return response;
    } catch (error) {
      if (error instanceof RoomApiError) {
        throw error;
      }
      throw new RoomNotFoundError(id);
    }
  }

  /**
   * Get rooms in a specific house
   */
  async getRoomsByHouse(houseId: number): Promise<Room[]> {
    try {
      const validatedHouseId = validateRoomId(houseId);
      const filters: RoomFilters = { house_id: validatedHouseId };
      return this.getRooms(filters);
    } catch (error) {
      return handleApiError(error, `Failed to fetch rooms for house ${houseId}`);
    }
  }

  /**
   * Get rooms by host ID
   */
  async getRoomsByHost(hostId: number): Promise<Room[]> {
    try {
      const validatedHostId = validateRoomId(hostId);
      const response = await api.get(`/api/rooms/host/${validatedHostId}`);
      return response;
    } catch (error) {
      return handleApiError(error, `Failed to fetch rooms for host ${hostId}`);
    }
  }

  /**
   * Search rooms with location and filters
   */
  async searchRooms(
    query: string,
    filters: RoomSearchFilters = {},
    options: RequestOptions = {},
  ): Promise<Room[]> {
    try {
      // Check if we have meaningful search criteria beyond just location
      const hasMeaningfulFilters =
        filters.check_in ||
        filters.check_out ||
        filters.adults ||
        filters.children ||
        filters.infants ||
        filters.pets ||
        filters.bedrooms ||
        filters.bathrooms ||
        filters.min_price ||
        filters.max_price ||
        filters.bounds ||
        // Add flexible search criteria
        filters.flexible_months ||
        filters.stay_duration ||
        filters.date_option ||
        // Add month mode criteria
        filters.month_duration ||
        filters.start_duration_date ||
        filters.date_flexibility;

      // Always use search endpoint if we have meaningful filters, even without query
      if (hasMeaningfulFilters) {
        const searchParams: Record<string, unknown> = {
          ...validateFilters(filters as any),
          ...(query.trim() && { location: query.trim() }),
        };

        // Map client bounds to backend expected params if present
        if (filters.bounds) {
          const { north, south, east, west } = filters.bounds;
          searchParams.ne_lat = north;
          searchParams.ne_lng = east;
          searchParams.sw_lat = south;
          searchParams.sw_lng = west;
          searchParams.search_by_map = true;
        }

        const response = await api.get('/api/rooms/search', searchParams, {
          signal: options.signal ?? null,
        });
        return response;
      }

      // Only fall back to getRooms if we have no meaningful filters and no query
      if (!query.trim()) {
        return this.getRooms(validateFilters(filters as any));
      }

      // Default search with location query
      const searchParams: Record<string, unknown> = {
        ...validateFilters(filters),
        location: query.trim(),
      };

      // Map client bounds to backend expected params if present
      if (filters.bounds) {
        const { north, south, east, west } = filters.bounds;
        searchParams.ne_lat = north;
        searchParams.ne_lng = east;
        searchParams.sw_lat = south;
        searchParams.sw_lng = west;
        searchParams.search_by_map = true;
      }

      const response = await api.get('/api/rooms/search', searchParams, {
        signal: options.signal ?? null,
      });
      return response;
    } catch (error) {
      return handleApiError(error, 'Failed to search rooms');
    }
  }

  /**
   * Get rooms by category/filter
   */
  async getRoomsByCategory(category: string, limit: number = 20): Promise<Room[]> {
    try {
      if (!category.trim()) {
        throw new InvalidRoomDataError('Category cannot be empty');
      }

      const filters: RoomFilters = {
        filter: category.trim(),
        limit: Math.max(1, Math.min(limit, 100)), // Clamp between 1-100
      };

      return this.getRooms(filters);
    } catch (error) {
      return handleApiError(error, `Failed to fetch rooms by category ${category}`);
    }
  }

  /**
   * Get featured rooms
   */
  async getFeaturedRooms(): Promise<Room[]> {
    try {
      const response = await api.get('/api/rooms/featured');
      return response;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch featured rooms');
    }
  }

  /**
   * Get available room filters with metadata
   */
  async getRoomFilters(): Promise<RoomFilter[]> {
    try {
      const response = await api.get('/api/rooms', { limit: 0 });
      const rooms = response || [];

      const filterCounts = new Map<string, number>();
      rooms.forEach((room: Room) => {
        if (room.filter) {
          filterCounts.set(room.filter, (filterCounts.get(room.filter) || 0) + 1);
        }
      });

      const filters: RoomFilter[] = Array.from(filterCounts.entries()).map(([filter, count]) => ({
        filter,
        iconName: this.generateIconName(filter),
        iconPath: this.generateIconPath(filter),
        count,
      }));

      return filters;
    } catch (error) {
      // Return default filters as fallback
      const defaultFilters: RoomFilter[] = [
        'Beach',
        'Cabins',
        'Top cities',
        'Countryside',
        'Amazing views',
      ].map((filter) => ({
        filter,
        iconName: this.generateIconName(filter),
        iconPath: this.generateIconPath(filter),
      }));

      return defaultFilters;
    }
  }

  /**
   * Get wishlist rooms by IDs
   */
  async getWishlistRooms(roomIds: readonly (string | number)[]): Promise<Room[]> {
    try {
      if (!roomIds.length) {
        return [];
      }

      const validatedIds = roomIds.map((id) => validateRoomId(id));
      const allRooms = await this.getRooms({ limit: 0 });

      const filteredRooms = allRooms.filter((room) => validatedIds.includes(room.id));

      return filteredRooms;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch wishlist rooms');
    }
  }

  /**
   * Create a new room with validation
   */
  async createRoom(roomData: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    try {
      this.validateRoomData(roomData);
      const response = await api.post('/api/rooms', roomData);
      return response;
    } catch (error) {
      return handleApiError(error, 'Failed to create room');
    }
  }

  /**
   * Update a room with validation
   */
  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room> {
    try {
      const validatedId = validateRoomId(id);
      this.validateRoomData(roomData);
      const response = await api.put(`/api/rooms/${validatedId}`, roomData);
      return response;
    } catch (error) {
      return handleApiError(error, `Failed to update room ${id}`);
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: number): Promise<void> {
    try {
      const validatedId = validateRoomId(id);
      await api.delete(`/api/rooms/${validatedId}`);
    } catch (error) {
      handleApiError(error, `Failed to delete room ${id}`);
    }
  }

  // === PRIVATE HELPER METHODS ===
  private generateIconName(filter: string): string {
    return filter.toLowerCase().replace(/\s+/g, '-');
  }

  private generateIconPath(filter: string): string {
    return `/icons/${this.generateIconName(filter)}.svg`;
  }

  private validateRoomData(roomData: Partial<Room>): void {
    if (roomData.title && !roomData.title.trim()) {
      throw new InvalidRoomDataError('Room title cannot be empty');
    }

    if (roomData.capacity?.max_guests && roomData.capacity.max_guests <= 0) {
      throw new InvalidRoomDataError('Max guests must be positive');
    }

    if (roomData.pricing?.base_price && roomData.pricing.base_price < 0) {
      throw new InvalidRoomDataError('Base price cannot be negative');
    }
  }
}

// === SINGLETON INSTANCE ===
const roomsService = new RoomsApiService();
export default roomsService;

// === EXPORT WRAPPER FUNCTIONS (avoid unbound method destructuring) ===
export const getRooms = (filters: RoomFilters = {}) => roomsService.getRooms(filters);
export const getRoomById = (id: string | number) => roomsService.getRoomById(id);
export const getRoomsByHouse = (houseId: number) => roomsService.getRoomsByHouse(houseId);
export const getRoomsByHost = (hostId: number) => roomsService.getRoomsByHost(hostId);
export const searchRooms = (
  query: string,
  filters: RoomSearchFilters = {},
  options: RequestOptions = {},
) => roomsService.searchRooms(query, filters, options);
export const getRoomsByCategory = (category: string, limit: number = 20) =>
  roomsService.getRoomsByCategory(category, limit);
export const getFeaturedRooms = () => roomsService.getFeaturedRooms();
export const getRoomFilters = () => roomsService.getRoomFilters();
export const getWishlistRooms = (roomIds: readonly (string | number)[]) =>
  roomsService.getWishlistRooms(roomIds);
export const createRoom = (roomData: Omit<Room, 'id' | 'created_at' | 'updated_at'>) =>
  roomsService.createRoom(roomData);
export const updateRoom = (id: number, roomData: Partial<Room>) =>
  roomsService.updateRoom(id, roomData);
export const deleteRoom = (id: number) => roomsService.deleteRoom(id);

// === BACKWARD COMPATIBILITY LAYER ===
// These functions maintain compatibility with the old API while using the new implementation

/**
 * @deprecated Use getWishlistRooms instead
 */
export const getWishList = (roomIds: readonly (string | number)[]): Promise<Room[]> => {
  return roomsService.getWishlistRooms(roomIds);
};

/**
 * @deprecated Use getRooms instead
 */
export const getAllRows = (filters?: RoomFilters): Promise<Room[]> => {
  return roomsService.getRooms(filters || {});
};

/**
 * @deprecated Use getRooms with wrapped response instead
 */
export const getAllRooms = async (): Promise<ApiResponse<Room[]>> => {
  try {
    const rooms = await roomsService.getRooms();
    return {
      data: rooms,
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const apiError: ApiError = {
      code: error instanceof RoomApiError ? error.code : 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch rooms',
      ...(error instanceof RoomApiError && error.details ? { details: error.details } : {}),
    };

    return {
      data: [],
      success: false,
      error: apiError,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * @deprecated Use getRooms instead
 */
export const fetchRowsWithOptions = (filters?: RoomFilters): Promise<Room[]> => {
  return roomsService.getRooms(filters || {});
};

/**
 * @deprecated Use getRoomById with wrapped response instead
 */
export const getRoomInfo = async (id: string | number): Promise<ApiResponse<Room | null>> => {
  try {
    const room = await roomsService.getRoomById(id);
    return {
      data: room,
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const apiError: ApiError = {
      code: error instanceof RoomApiError ? error.code : 'ROOM_NOT_FOUND',
      message: error instanceof Error ? error.message : 'Room not found',
      ...(error instanceof RoomApiError && error.details ? { details: error.details } : {}),
    };

    return {
      data: null,
      success: false,
      error: apiError,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * @deprecated Use getRooms instead
 */
export const fetchRoomsWithFilters = (filters?: RoomFilters): Promise<Room[]> => {
  return roomsService.getRooms(filters || {});
};
