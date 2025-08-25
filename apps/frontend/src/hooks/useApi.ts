import { useState, useEffect, useCallback } from 'react';
import {
  Room,
  RoomFilters,
  PaginationParams,
  UseApiReturn,
  UseInfiniteQueryReturn,
} from '../types';
import { dataService } from '../services/dataService';

/**
 * Custom hooks for data fetching with proper error handling and loading states
 */

/**
 * Generic hook for loading data with error handling and loading states
 */
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: unknown[] = [],
  initialData?: T,
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch };
}

/**
 * Hook for loading all rooms data
 */
export function useRooms(forceRefresh: boolean = false) {
  return useApiData(() => dataService.getRoomsData(forceRefresh), [forceRefresh]);
}

/**
 * Hook for loading a single room by ID
 */
export function useRoom(roomId: string | null) {
  return useApiData(
    () => (roomId ? dataService.getRoomById(roomId) : Promise.resolve(null)),
    [roomId],
  );
}

/**
 * Hook for loading filtered rooms with pagination
 */
export function useFilteredRooms(filters: RoomFilters = {}, pagination: PaginationParams = {}) {
  return useApiData(
    () => dataService.getFilteredRooms(filters, pagination),
    [JSON.stringify(filters), JSON.stringify(pagination)],
  );
}

/**
 * Hook for searching rooms
 */
export function useSearchRooms(query: string, limit: number = 20) {
  return useApiData(
    () => (query.trim() ? dataService.searchRooms(query, limit) : Promise.resolve([])),
    [query, limit],
  );
}

/**
 * Hook for loading user favorites
 */
export function useFavoriteRooms(favoriteIds: string[]) {
  return useApiData(() => dataService.getUserFavorites(favoriteIds), [JSON.stringify(favoriteIds)]);
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteRooms(
  filters: RoomFilters = {},
  itemsPerPage: number = 20,
): UseInfiniteQueryReturn<Room> {
  const [data, setData] = useState<Room[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [status, setStatus] = useState<'pending' | 'error' | 'success'>('pending');
  const [error, setError] = useState<Error | null>(null);

  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage) return;

    try {
      setIsFetchingNextPage(true);
      setError(null);

      const pagination: PaginationParams = {
        page: currentPage + 1,
        limit: itemsPerPage,
      };

      const result = await dataService.getFilteredRooms(filters, pagination);

      if (result.success && result.data.length > 0) {
        setData((prevData) => [...prevData, ...result.data]);
        setCurrentPage((prev) => prev + 1);
        setHasNextPage(result.meta.hasMore);
        setStatus('success');
      } else {
        setHasNextPage(false);
        if (!result.success && result.error) {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Error fetching next page:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setStatus('error');
      setHasNextPage(false);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [filters, currentPage, itemsPerPage, isFetchingNextPage, hasNextPage]);

  // Reset when filters change
  useEffect(() => {
    setData([]);
    setCurrentPage(0);
    setHasNextPage(true);
    setStatus('pending');
    setError(null);
    // Fetch initial page
    fetchNextPage();
  }, [JSON.stringify(filters), itemsPerPage]);

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  };
}

/**
 * Hook for managing favorites
 */
export function useFavoriteManager(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addFavorite = useCallback(
    async (roomId: string) => {
      if (!userId) return false;

      try {
        setLoading(true);
        // In a real app, this would call an API
        setFavorites((prev) => [...prev, roomId]);
        console.log(`Added room ${roomId} to favorites for user ${userId}`);
        return true;
      } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  const removeFavorite = useCallback(
    async (roomId: string) => {
      if (!userId) return false;

      try {
        setLoading(true);
        // In a real app, this would call an API
        setFavorites((prev) => prev.filter((id) => id !== roomId));
        console.log(`Removed room ${roomId} from favorites for user ${userId}`);
        return true;
      } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  const isFavorite = useCallback(
    (roomId: string) => {
      return favorites.includes(roomId);
    },
    [favorites],
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    loading,
  };
}

/**
 * Hook for local data caching and persistence
 */
export function useDataCache() {
  const clearCache = useCallback(() => {
    dataService.clearCache();
    // Also clear localStorage cache if you're using it
    try {
      localStorage.removeItem('airbnb_rooms_cache');
      localStorage.removeItem('airbnb_favorites_cache');
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    clearCache();
    // Force refresh all data
    await dataService.getRoomsData(true);
    await dataService.getBookingsData(true);
    await dataService.getFavoritesData(true);
    await dataService.getPaymentsData(true);
  }, [clearCache]);

  return {
    clearCache,
    refreshData,
  };
}
