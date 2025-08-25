import React from 'react';
import { useRooms, useSearchRooms } from '../../hooks/useApi';
import { NetworkError, EmptyState } from '../ErrorBoundary';
import { Room } from '../../types';
import { appConfig } from '../../config';

interface RoomCardProps {
  room: Room;
  onFavoriteToggle?: ((roomId: string) => void) | undefined;
  isFavorite?: boolean | undefined;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onFavoriteToggle, isFavorite = false }) => {
  const handleFavoriteClick = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(room.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={room.images[0] || '/placeholder.jpg'}
          alt={room['house-title']}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200 ${
            isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate pr-2">{room['house-title']}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {room.rating.toFixed(1)}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {room.city}, {room.country}
        </p>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{room.description}</p>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {room.bedrooms} bed{room.bedrooms !== 1 ? 's' : ''} • {room.bathrooms} bath
            {room.bathrooms !== 1 ? 's' : ''}
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-900">${room.price}</span>
            <span className="text-sm text-gray-600"> /night</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {room.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              +{room.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface RoomListProps {
  searchQuery?: string;
  favoriteIds?: string[];
  onFavoriteToggle?: ((roomId: string) => void) | undefined;
  filters?: {
    category?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    guests?: number | undefined;
  };
}

const RoomList: React.FC<RoomListProps> = ({
  searchQuery = '',
  favoriteIds = [],
  onFavoriteToggle,
  filters = {},
}) => {
  // Use search hook if there's a search query, otherwise use rooms hook
  const searchResults = useSearchRooms(searchQuery, appConfig.ui.itemsPerPage);
  const allRooms = useRooms();

  // Choose which data to use based on whether we're searching
  const activeQuery = searchQuery.trim() ? searchResults : allRooms;
  const { data, loading, error, refetch } = activeQuery;

  // Filter data based on filters prop
  const filteredData = React.useMemo(() => {
    if (!data) return [];

    let filtered: Room[] = Array.isArray(data) ? data : [];

    if (filters.category) {
      filtered = filtered.filter((room: Room) =>
        room.filter?.toLowerCase().includes(filters.category!.toLowerCase()),
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter((room: Room) => room.price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((room: Room) => room.price <= filters.maxPrice!);
    }

    if (filters.guests) {
      filtered = filtered.filter((room: Room) => room.max_guests >= filters.guests!);
    }

    return filtered;
  }, [data, filters]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <NetworkError onRetry={refetch} />;
  }

  if (!filteredData || filteredData.length === 0) {
    const title = searchQuery ? `No results found for "${searchQuery}"` : 'No rooms available';
    const description = searchQuery
      ? "Try adjusting your search or filters to find what you're looking for."
      : 'There are no rooms available at the moment. Please check back later.';

    return (
      <EmptyState
        title={title}
        description={description}
        action={
          searchQuery
            ? {
                label: 'Clear search',
                onClick: () => window.location.reload(),
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredData.map((room: Room) => (
        <RoomCard
          key={room.id}
          room={room}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={favoriteIds.includes(room.id)}
        />
      ))}
    </div>
  );
};

// Example usage component with search and filtering
const RoomExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<{
    category: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    guests: number | undefined;
  }>({
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    guests: undefined,
  });

  const handleFavoriteToggle = (roomId: string) => {
    setFavorites((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the RoomList component
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore Rooms</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for rooms, locations, or amenities..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['Beach', 'Cabins', 'Amazing pools', 'Top cities'].map((category) => (
            <button
              key={category}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  category: prev.category === category ? '' : category,
                }))
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <RoomList
        searchQuery={searchQuery}
        favoriteIds={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        filters={filters}
      />
    </div>
  );
};

export { RoomCard, RoomList, RoomExplorer };
export default RoomExplorer;
