// Type definitions for the application
// Re-export the main types from apiRooms for consistency
export type {
  Room,
  PropertyDetail,
  Host,
  RoomLocation,
  RoomPricing,
  RoomCapacity,
  RoomSearchFilters,
  RoomFilter,
  ApiError,
} from '../api/apiRooms';

export {
  RoomType,
  PropertyType,
  CancellationPolicy,
  RoomApiError,
  RoomNotFoundError,
  InvalidRoomDataError,
} from '../api/apiRooms';

// Re-export with new names to avoid conflicts
export type {
  RoomFilters as RoomQueryFilters,
  ApiResponse as ApiResponseWrapper,
  PaginatedResponse as PaginatedResponseWrapper,
} from '../api/apiRooms';

export interface Review {
  id: string;
  user_name: string;
  user_image: string;
  rating: number;
  comment: string;
  date: string;
  room_id: string;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  room_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  joined: string;
  verified: boolean;
}

export interface FilterOption {
  iconName: string;
  iconPath: string;
  isSelected?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Query parameters
export interface RoomFilters {
  ids?: string[];
  country?: string;
  city?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  amenities?: string[];
  propertyType?: string;
  instantBook?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Redux store types
export interface AppState {
  userData: User | null;
  userFavListing: string[];
  selectedIcon: string;
  selectedCountry: string;
  startScroll: boolean;
  minimize: boolean;
  isFavorite: boolean | null;
  itemId: string | number | null;
  bookingDate: string | null;
  city: string;
  inputSearchIds: string[];
}

export interface FormState {
  activeInput: string;
  selectedStartDate: string | null;
  selectedEndDate: string | null;
  adultCount: number;
  childCount: number;
  infantCount: number;
  petsCount: number;
  isCalendarModalOpen: boolean;
  startDateToShow: string;
  endDateToShow: string;
  textForGuestInput: string;
  combinedString: Array<Record<string, string>>;
}

export interface RootState {
  app: AppState;
  form: FormState;
  filter: {
    selectedFilters: string[];
  };
  card: {
    scrollPositions: Record<string, number>;
  };
  bookings: {
    bookings: Booking[];
    loading: boolean;
    error: string | null;
  };
}

// Hook return types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseInfiniteQueryReturn<T> {
  data: T[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  status: 'pending' | 'error' | 'success';
  error: Error | null;
}
