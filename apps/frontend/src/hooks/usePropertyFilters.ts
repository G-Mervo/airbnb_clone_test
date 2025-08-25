import { useState, useMemo } from 'react';

interface Property {
  id: string;
  title: string;
  location: string;
  host: string;
  dates: string;
  price: number;
  rating: number;
  lat: number;
  lng: number;
  image: string;
  isSuperhostCard?: boolean;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UsePropertyFiltersReturn {
  filteredProperties: Property[];
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds) => void;
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  totalProperties: number;
}

export const usePropertyFilters = (properties: Property[]): UsePropertyFiltersReturn => {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Filter by map bounds
    if (mapBounds) {
      filtered = filtered.filter((property) => {
        return (
          property.lat <= mapBounds.north &&
          property.lat >= mapBounds.south &&
          property.lng <= mapBounds.east &&
          property.lng >= mapBounds.west
        );
      });
    }

    // Apply other filters
    if (activeFilters.includes('Superhost')) {
      filtered = filtered.filter((property) => property.isSuperhostCard);
    }

    if (activeFilters.includes('Entire homes')) {
      // In a real app, you'd have property type data
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes('apartment') ||
          property.title.toLowerCase().includes('studio') ||
          property.title.toLowerCase().includes('loft'),
      );
    }

    if (activeFilters.includes('Private rooms')) {
      filtered = filtered.filter((property) => property.title.toLowerCase().includes('room'));
    }

    // Price filters could be added here
    // Rating filters could be added here
    // Amenity filters could be added here

    return filtered;
  }, [properties, mapBounds, activeFilters]);

  return {
    filteredProperties,
    mapBounds,
    setMapBounds,
    activeFilters,
    setActiveFilters,
    totalProperties: properties.length,
  };
};
