import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, List } from 'lucide-react';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Property {
  id: string;
  title: string;
  price: number;
  rating: number;
  lat: number;
  lng: number;
  image: string;
  location: string;
  host: string;
  dates: string;
  isSuperhostCard?: boolean;
}

interface MapViewProps {
  properties: Property[];
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onPropertySelect: (propertyId: string) => void;
  selectedProperty?: string;
  showPropertyList: boolean;
  onToggleView: () => void;
}

// Custom marker icon for properties
const createPropertyIcon = (price: number, isSelected: boolean) => {
  return L.divIcon({
    html: `
      <div class="property-marker ${isSelected ? 'selected' : ''}">
        <div class="marker-content">
          <div class="marker-price">$${price}</div>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });
};

const MapView = ({
  properties,
  onBoundsChange,
  onPropertySelect,
  selectedProperty,
  showPropertyList,
  onToggleView,
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Create map
    mapInstance.current = L.map(mapRef.current).setView([10.8231, 106.6297], 11);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    // Add map event listeners
    const handleMapMove = () => {
      if (!mapInstance.current) return;

      const bounds = mapInstance.current.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    mapInstance.current.on('moveend', handleMapMove);
    mapInstance.current.on('zoomend', handleMapMove);

    // Initial bounds update
    handleMapMove();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [onBoundsChange]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstance.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    properties.forEach((property) => {
      const marker = L.marker([property.lat, property.lng], {
        icon: createPropertyIcon(property.price, selectedProperty === property.id),
      });

      marker.on('click', () => {
        onPropertySelect(property.id);
      });

      marker.bindPopup(`
        <div class="text-center">
          <h3 class="font-medium">${property.title}</h3>
          <p class="text-sm text-gray-600">${property.location}</p>
          <p class="font-semibold">$${property.price}/night</p>
        </div>
      `);

      marker.addTo(mapInstance.current!);
      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty, onPropertySelect]);

  // Fly to selected property
  useEffect(() => {
    if (!mapInstance.current || !selectedProperty) return;

    const property = properties.find((p) => p.id === selectedProperty);
    if (property) {
      mapInstance.current.flyTo([property.lat, property.lng], 15, {
        duration: 1,
      });
    }
  }, [selectedProperty, properties]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0 rounded-lg z-0" />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={onToggleView}
          variant="secondary"
          className="bg-surface shadow-card hover:shadow-hover"
        >
          {showPropertyList ? (
            <MapPin className="mr-2 h-4 w-4" />
          ) : (
            <List className="mr-2 h-4 w-4" />
          )}
          {showPropertyList ? 'Show map' : 'Show list'}
        </Button>
      </div>

      {/* Property Count */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-surface shadow-card px-4 py-2 rounded-full border border-border">
          <span className="text-sm font-medium text-text-primary">{properties.length} stays</span>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .property-marker {
            cursor: pointer;
          }

          .marker-content {
            background: white;
            border: 2px solid #fff;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 600;
            color: #222;
            transition: all 0.2s ease;
          }

          .property-marker:hover .marker-content,
          .property-marker.selected .marker-content {
            background: hsl(var(--coral));
            color: white;
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          .marker-price {
            white-space: nowrap;
          }

          .custom-div-icon {
            background: transparent !important;
            border: none !important;
          }

          .leaflet-popup-content-wrapper {
            background: hsl(var(--surface));
            color: hsl(var(--text-primary));
            border-radius: 8px;
          }

          .leaflet-popup-tip {
            background: hsl(var(--surface));
          }
        `,
        }}
      />
    </div>
  );
};

export default MapView;
