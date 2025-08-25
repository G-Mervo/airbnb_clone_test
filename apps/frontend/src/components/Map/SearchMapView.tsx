import { Maximize2, Minimize2, Minus, Plus, Search } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { generatePlaceholderImage, getSafeImageUrl, handleImageError } from '@/utils/imageUtils';

interface Property {
  id: number;
  title: string;
  'house-title'?: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  coordinates: [number, number];
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SearchMapViewProps {
  properties: Property[];
  isLoading: boolean;
  isExpanded: boolean;
  hoveredProperty: number | null;
  selectedProperty: number | null;
  selectedPropertyData: Property | null;
  popupPosition: {
    x: number;
    y: number;
    position: 'below' | 'above';
  } | null;
  showSearchButton: boolean;
  mapCenter: { center: [number, number]; zoom: number };
  onExpandToggle: () => void;
  onPropertyHover: (propertyId: number | null) => void;
  onPropertySelect: (propertyId: number | null, propertyData?: Property | null) => void;
  onPopupPositionChange: (position: any) => void;
  onMapBoundsChange: (bounds: MapBounds) => void;
  onSearchArea: () => void;
  onUserInteraction: () => void;
}

const SearchMapView: React.FC<SearchMapViewProps> = ({
  properties,
  isLoading,
  isExpanded,
  hoveredProperty,
  selectedProperty,
  selectedPropertyData,
  popupPosition,
  showSearchButton,
  mapCenter,
  onExpandToggle,
  onPropertyHover,
  onPropertySelect,
  onPopupPositionChange,
  onMapBoundsChange,
  onSearchArea,
  onUserInteraction,
}) => {
  // Debug props received
  console.log('🏗️ SearchMapView component rendered with:', {
    propertiesCount: properties.length,
    isLoading,
    isExpanded,
    mapCenter,
    firstProperty: properties[0],
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [initialMapSet, setInitialMapSet] = useState(false);

  // Update map bounds helper
  const updateMapBounds = useCallback(
    (mapInstance: any) => {
      if (!mapInstance || !mapInstance.getBounds) {
        console.warn('Map instance not available for bounds update');
        return;
      }

      try {
        const bounds = mapInstance.getBounds();
        if (bounds && typeof bounds.getNorth === 'function') {
          const newBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          };

          // Validate bounds are reasonable numbers
          const isValidBounds = Object.values(newBounds).every(
            (val) => typeof val === 'number' && !isNaN(val) && isFinite(val),
          );

          if (isValidBounds) {
            onMapBoundsChange(newBounds);
            console.log('Map bounds updated successfully:', newBounds);
          } else {
            console.warn('Invalid bounds values:', newBounds);
          }
        } else {
          console.warn('Bounds object missing required methods');
        }
      } catch (error) {
        console.error('Error updating map bounds:', error);
      }
    },
    [onMapBoundsChange],
  );

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      // Ensure the map container has dimensions
      const container = mapRef.current;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Map container has no dimensions, retrying...');
        setTimeout(() => {
          // Retry after a delay
        }, 100);
        return;
      }

      setTimeout(() => {
        import('leaflet').then((L) => {
          if (!mapRef.current || mapInstanceRef.current) return;

          // Start with proper center based on search
          const { center, zoom } = mapCenter;
          const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);

          // Mark that initial map position has been set
          setInitialMapSet(true);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          mapInstanceRef.current = map;

          console.log('🗺️ Map initialized successfully:', {
            center: map.getCenter(),
            zoom: map.getZoom(),
            container: mapRef.current?.offsetWidth + 'x' + mapRef.current?.offsetHeight,
          });

          // Test marker - add a simple test marker to verify map is working
          // Using Myrtle Beach coordinates since that's where the properties are
          const testMarker = L.marker([33.6891, -78.8867]).addTo(map);
          testMarker.bindPopup('Test marker - Myrtle Beach');
          console.log('🧪 Test marker added at Myrtle Beach coordinates');

          // Add click handler to map to close popup when clicking elsewhere
          map.on('click', () => {
            onPropertySelect(null, null);
            onPopupPositionChange(null);
          });

          // Handle map movement events for filtering
          map.on('movestart', () => {
            onUserInteraction();
            setInitialMapSet(true); // Ensure no resets after user interaction
          });

          map.on('zoomstart', () => {
            onUserInteraction();
            setInitialMapSet(true); // Ensure no resets after user interaction
          });

          map.on('moveend', () => {
            try {
              updateMapBounds(map);
            } catch (error) {
              console.warn('Error handling moveend event:', error);
            }
          });

          map.on('zoomend', () => {
            try {
              updateMapBounds(map);
            } catch (error) {
              console.warn('Error handling zoomend event:', error);
            }
          });

          // Add custom marker styles
          const styleId = 'search-map-style';
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
              .custom-div-icon {
                background: transparent !important;
                border: none !important;
                pointer-events: auto !important;
              }
              .leaflet-marker-icon {
                pointer-events: auto !important;
              }

              /* Price marker styles with smooth animations */
              .price-marker {
                background: white;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #222222;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
                opacity: 1;
              }

              .price-marker:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                z-index: 1500;
              }

              .hovered-marker {
                background: white;
                border: 2px solid #222222;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #222222;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                cursor: pointer;
                transform: scale(1.1);
                z-index: 2000;
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 1;
              }

              .selected-marker {
                background: #222222;
                border: 2px solid #222222;
                border-radius: 20px;
                padding: 4px 12px;
                font-family: "Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: white;
                box-shadow: 0 6px 16px rgba(0,0,0,0.35);
                cursor: pointer;
                transform: scale(1.15);
                z-index: 3000;
                white-space: nowrap;
                line-height: 1.2;
                min-width: 50px;
                text-align: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 1;
              }

              /* Smooth fade transitions for markers */
              .leaflet-marker-icon {
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }
            `;
            document.head.appendChild(style);
          }
        });
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
        setInitialMapSet(false);
      }
    };
  }, [mapCenter, onPropertySelect, onPopupPositionChange, onUserInteraction, updateMapBounds]);

  // Set initial map center only once during map initialization
  useEffect(() => {
    if (mapInstanceRef.current && !initialMapSet) {
      if (properties.length > 0) {
        const { center, zoom } = mapCenter;

        mapInstanceRef.current.setView(center, zoom);
      } else {
        // Set US center when no properties initially

        mapInstanceRef.current.setView([39.8283, -98.5795], 4);
      }
      setInitialMapSet(true);
    }
  }, [initialMapSet, properties.length, mapCenter]);

  // When expanding/collapsing the map, ensure Leaflet recalculates size
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const t = setTimeout(() => {
      try {
        mapInstanceRef.current.invalidateSize();
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [isExpanded]);

  // When selection changes, update marker styles accordingly
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const createCustomIcon = (price: number, isHovered: boolean, isSelected: boolean) => {
        const className = isSelected
          ? 'selected-marker'
          : isHovered
          ? 'hovered-marker'
          : 'price-marker';
        return L.divIcon({
          html: `<div class="${className}">$${price}</div>`,
          className: 'custom-div-icon',
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });
      };

      markersRef.current.forEach(({ id, marker, property }) => {
        const isHovered = hoveredProperty === id;
        const isSelected = selectedProperty === id;
        marker.setIcon(createCustomIcon(property.price, isHovered, isSelected));
      });
    });
  }, [selectedProperty, hoveredProperty]);

  // Smooth marker updates - preserve existing markers during transitions
  useEffect(() => {
    console.log('🔍 Marker useEffect triggered with:', {
      mapInstance: !!mapInstanceRef.current,
      window: typeof window !== 'undefined',
      propertiesCount: properties.length,
      isLoading,
      firstProperty: properties[0],
    });

    if (!mapInstanceRef.current || typeof window === 'undefined') {
      console.log('❌ Skipping marker update - missing requirements:', {
        mapInstance: !!mapInstanceRef.current,
        window: typeof window !== 'undefined',
        propertiesCount: properties.length,
      });
      return;
    }

    if (properties.length === 0) {
      console.log('⚠️ No properties to display markers for');
      // Clear any existing markers
      markersRef.current.forEach(({ marker }) => {
        if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
      return;
    }

    import('leaflet').then((L) => {
      console.log(
        '📦 Leaflet loaded, starting marker creation for',
        properties.length,
        'properties',
      );

      // Clear existing markers first for simplicity
      markersRef.current.forEach(({ marker }) => {
        if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
      console.log('🧹 Cleared existing markers');

      // Create simple test markers
      console.log(
        '🗺️ All property coordinates:',
        properties.map((p) => ({
          id: p.id,
          title: p.title,
          coords: p.coordinates,
          lat: p.coordinates?.[0],
          lng: p.coordinates?.[1],
        })),
      );

      properties.forEach((property, index) => {
        console.log(`🎯 Processing property ${index + 1}:`, {
          id: property.id,
          title: property.title,
          coordinates: property.coordinates,
          price: property.price,
          coordinateTypes: property.coordinates?.map((c) => typeof c),
        });
        if (
          !property.coordinates ||
          !Array.isArray(property.coordinates) ||
          property.coordinates.length !== 2 ||
          isNaN(property.coordinates[0]) ||
          isNaN(property.coordinates[1])
        ) {
          console.log(
            '❌ Skipping property due to invalid coordinates:',
            property.id,
            property.coordinates,
          );
          return;
        }

        console.log(
          `✅ Creating marker for property ${property.id} at [${property.coordinates.join(', ')}]`,
        );

        // Try BOTH simple marker AND custom marker for debugging
        // 1. First create a simple default marker to test basic functionality
        console.log('🔧 Creating simple test marker first...');
        const simpleMarker = L.marker(property.coordinates).addTo(mapInstanceRef.current);
        simpleMarker.bindPopup(`Simple: ${property.title} - $${property.price}`);
        console.log('✅ Simple marker created successfully');

        // 2. Now try the custom styled marker
        console.log('🎨 Creating custom styled marker...');
        const priceMarker = L.divIcon({
          html: `<div class="price-marker">$${property.price}</div>`,
          className: 'custom-div-icon',
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });

        const marker = L.marker(
          [property.coordinates[0] + 0.001, property.coordinates[1] + 0.001],
          { icon: priceMarker },
        ).addTo(mapInstanceRef.current);

        console.log(`🎨 Marker created and added to map:`, {
          propertyId: property.id,
          markerPosition: marker.getLatLng(),
          mapCenter: mapInstanceRef.current.getCenter(),
          mapZoom: mapInstanceRef.current.getZoom(),
        });

        // Add BOTH markers to our tracking array for debugging
        markersRef.current.push({ id: property.id, marker: simpleMarker, property });
        markersRef.current.push({ id: property.id + '_custom', marker, property });

        // Add click handler with popup positioning
        marker.on('click', function () {
          onPropertySelect(property.id, property);

          // Calculate popup position relative to marker
          const map = mapInstanceRef.current;
          if (map && mapRef.current) {
            const markerLatLng = marker.getLatLng();
            const markerPoint = map.latLngToContainerPoint(markerLatLng);
            const mapRect = mapRef.current.getBoundingClientRect();

            // Popup dimensions (updated for new design)
            const popupWidth = 320;
            const popupHeight = 280; // Reduced height for the new compact design
            const margin = 16;

            // Position popup above the marker
            let x = markerPoint.x - popupWidth / 2; // Center horizontally on marker
            let y = markerPoint.y - popupHeight - 40; // Position above marker with some space
            let position: 'below' | 'above' = 'above';

            // Check if popup fits above, otherwise position below
            if (y < margin) {
              y = markerPoint.y + 40; // Below marker
              position = 'below';
            }

            // Keep popup within map bounds horizontally
            if (x < margin) {
              x = margin;
            } else if (x + popupWidth > mapRect.width - margin) {
              x = mapRect.width - popupWidth - margin;
            }

            // Keep popup within map bounds vertically
            if (y < margin) {
              y = margin;
            } else if (y + popupHeight > mapRect.height - margin) {
              y = mapRect.height - popupHeight - margin;
            }

            onPopupPositionChange({ x, y, position });
          }
        });

        // Add hover effects
        marker.on('mouseover', function () {
          if (selectedProperty !== property.id) {
            onPropertyHover(property.id);
          }
        });

        marker.on('mouseout', function () {
          onPropertyHover(null);
        });
      });

      console.log(`🎉 Total markers created: ${markersRef.current.length}`);
      console.log('📍 Current map state:', {
        center: mapInstanceRef.current.getCenter(),
        zoom: mapInstanceRef.current.getZoom(),
        bounds: mapInstanceRef.current.getBounds(),
      });

      // Force the map to fit the markers if we have any
      if (markersRef.current.length > 0) {
        console.log('🎯 Attempting to fit map bounds to markers...');
        try {
          const group = new L.featureGroup(markersRef.current.map((m) => m.marker));
          const bounds = group.getBounds();
          console.log('📦 Marker bounds:', bounds);

          // Try with generous padding first
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
          console.log('✅ Map view adjusted to fit all markers');

          // Also try setting a specific view as backup
          setTimeout(() => {
            if (properties.length > 0 && properties[0].coordinates) {
              console.log('🎯 Setting fallback view to first property coordinates');
              mapInstanceRef.current.setView(properties[0].coordinates, 10);
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Error fitting bounds:', error);
          // Fallback: center on first property
          if (properties.length > 0 && properties[0].coordinates) {
            console.log('🎯 Fallback: Setting view to first property');
            mapInstanceRef.current.setView(properties[0].coordinates, 10);
          }
        }
      }
    });
  }, [properties]);

  return (
    <div
      className={`${
        isExpanded ? 'pr-6 pl-6 w-full' : 'pr-6 pl-6 w-1/2'
      } py-6 bg-white sticky top-20 z-0`}
    >
      <div className={`overflow-hidden relative bg-gray-100 rounded-xl h-[calc(100vh-140px)]`}>
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '600px' }} />

        {/* Enhanced loading indicator with dots pattern like in the image */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none z-[1100]">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-4">
                {/* Three dots loading pattern matching the image */}
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced property popup matching the attached image */}
        {selectedPropertyData && popupPosition && (
          <div
            className="absolute bg-white rounded-xl shadow-lg overflow-hidden z-[1100] transition-all duration-300 ease-out border border-gray-200"
            style={{
              width: '320px',
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`,
              transformOrigin: popupPosition.position === 'above' ? 'bottom center' : 'top center',
            }}
          >
            <div
              className="cursor-pointer"
              onClick={() => window.open(`/house/${selectedPropertyData.id}`, '_blank')}
            >
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                {selectedPropertyData.images?.[0] ? (
                  <img
                    src={
                      getSafeImageUrl(selectedPropertyData.images[0]) ||
                      selectedPropertyData.images[0]
                    }
                    alt={selectedPropertyData.title}
                    className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                    onError={(e) => {
                      const firstLetter =
                        selectedPropertyData.title?.charAt(0)?.toUpperCase() ||
                        selectedPropertyData['house-title']?.charAt(0)?.toUpperCase() ||
                        'H';
                      handleImageError(e.currentTarget as any, firstLetter);
                    }}
                  />
                ) : (
                  <div
                    className="flex justify-center items-center w-full h-full bg-gray-200"
                    style={{
                      backgroundImage: `url(${generatePlaceholderImage(
                        selectedPropertyData.title?.charAt(0)?.toUpperCase() ||
                          selectedPropertyData['house-title']?.charAt(0)?.toUpperCase() ||
                          'H',
                      )})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}

                {/* Favorite Heart Button */}
                <button
                  className="absolute top-3 right-11 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Add to favorites functionality
                  }}
                  aria-label="Add to favorites"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8.86 2.677c1.177-1.177 3.123-1.177 4.3 0 1.177 1.177 1.177 3.123 0 4.3L8 12.837l-5.16-5.86c-1.177-1.177-1.177-3.123 0-4.3 1.177-1.177 3.123-1.177 4.3 0L8 3.537l.86-.86z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                </button>

                {/* Close Button */}
                <button
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPropertySelect(null);
                  }}
                  aria-label="Close"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M9 3L3 9M3 3l6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Property Details */}
              <div className="p-4 space-y-2">
                {/* Title and Rating Row */}
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
                    {selectedPropertyData.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 1l1.545 3.13L11 4.635 8.5 7.07l.59 3.44L6 9.065 2.91 10.51l.59-3.44L1 4.635l3.455-.505L6 1z" />
                    </svg>
                    <span className="font-medium">{selectedPropertyData.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({selectedPropertyData.reviews})</span>
                  </div>
                </div>

                {/* Location */}
                <p className="text-sm text-gray-600 truncate">{selectedPropertyData.location}</p>

                {/* Property Type */}
                <p className="text-sm text-gray-600">2 beds · 1 bedroom</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-lg font-semibold text-gray-900">
                    ${selectedPropertyData.price}
                  </span>
                  <span className="text-sm text-gray-600">for 9 nights</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search this area button */}
        {showSearchButton && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
            <button
              onClick={onSearchArea}
              className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-full shadow-lg transition-colors hover:bg-gray-800"
            >
              <Search className="w-4 h-4" />
              Search this area
            </button>
          </div>
        )}

        {/* Expand (circle) */}
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
            onClick={onExpandToggle}
            className="flex justify-center items-center w-10 h-10 bg-white rounded-full border border-gray-200 shadow-sm transition-colors hover:bg-gray-50"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Zoom controls (shared pill with divider) */}
        <div className="absolute top-16 right-4 z-[1000]">
          <div className="flex overflow-hidden flex-col bg-white rounded-full border border-gray-200 shadow-sm">
            <button
              aria-label="Zoom in"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="flex justify-center items-center w-10 h-10 transition-colors hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-px bg-gray-200" />
            <button
              aria-label="Zoom out"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="flex justify-center items-center w-10 h-10 transition-colors hover:bg-gray-50"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Load Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  );
};

export default SearchMapView;
