import React, { useEffect, useMemo } from 'react';
import CarouselSection from './CarouselSection';
import CarouselSkeleton from './CarouselSkeleton';
import { useDispatch } from 'react-redux';
import { setMinimize, setStartScroll } from '../../redux/AppSlice';
import { setActiveInput } from '../../redux/mainFormSlice';
import { Room as PropertyDetail } from '../../api/apiRooms';

interface HomeSectionsProps {
  properties?: PropertyDetail[];
  isLoading?: boolean;
}

interface SectionData {
  title: string;
  items: PropertyDetail[];
  filterType: 'category' | 'propertyType' | 'city';
  filterValue: string;
}

function HomeSections({ properties, isLoading }: HomeSectionsProps) {
  const dispatch = useDispatch();

  // Mirror referenced-repo scroll behaviour to drive header minimization
  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollPosition = window.scrollY;
      dispatch(setMinimize(false));
      dispatch(setActiveInput(''));
      if (currentScrollPosition > 0) {
        dispatch(setStartScroll(false));
      } else if (currentScrollPosition < 22) {
        dispatch(setStartScroll(true));
      }
    };

    window.addEventListener('scroll', handleWindowScroll);
    // Call once on mount to set initial state
    handleWindowScroll();
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [dispatch]);

  const sections = useMemo(() => {
    // Only work with properties data - no fallback to legacy rooms
    if (!properties || properties.length === 0) {
      return [];
    }

    const sections: SectionData[] = [];

    // 1. Featured properties (with high ratings)
    const featuredProperties = properties.filter(
      (p) => p.average_rating && p.average_rating >= 4.5,
    );
    if (featuredProperties.length > 0) {
      sections.push({
        title: 'Highly Rated Properties',
        items: featuredProperties.slice(0, 12),
        filterType: 'category',
        filterValue: 'highly-rated',
      });
    }

    // 2. Group by property type
    const propertyTypeGroups: Record<string, PropertyDetail[]> = {};
    properties.forEach((property) => {
      const type = property.property_type || 'Other';
      if (type === 'Other') return;
      if (!propertyTypeGroups[type]) {
        propertyTypeGroups[type] = [];
      }
      propertyTypeGroups[type].push(property);
    });

    // Add property type sections (only if they have multiple items)
    Object.entries(propertyTypeGroups)
      .filter(([_, items]) => items.length >= 3)
      .slice(0, 3) // Limit to 3 property type sections
      .forEach(([type, items]) => {
        sections.push({
          title: `${type}s`,
          items: items.slice(0, 12),
          filterType: 'propertyType',
          filterValue: type,
        });
      });

    // 3. Group by city/location
    const cityGroups: Record<string, PropertyDetail[]> = {};
    properties.forEach((property) => {
      const city = property.location?.city || 'Other';
      if (city === 'Other') return;
      if (!cityGroups[city]) {
        cityGroups[city] = [];
      }
      cityGroups[city].push(property);
    });

    // Add city sections (only for cities with multiple properties)
    Object.entries(cityGroups)
      .filter(([_, items]) => items.length >= 3)
      .sort((a, b) => b[1].length - a[1].length) // Sort by property count
      .slice(0, 4) // Limit to top 4 cities
      .forEach(([city, items]) => {
        sections.push({
          title: `Explore ${city}`,
          items: items.slice(0, 12),
          filterType: 'city',
          filterValue: city,
        });
      });

    // 4. Budget-friendly options
    const budgetProperties = properties.filter((p) => p.pricing && p.pricing.base_price <= 150);
    if (budgetProperties.length >= 3) {
      sections.push({
        title: 'Budget-Friendly Stays',
        items: budgetProperties.slice(0, 12),
        filterType: 'category',
        filterValue: 'budget',
      });
    }

    // 5. Luxury options
    const luxuryProperties = properties.filter((p) => p.pricing && p.pricing.base_price >= 300);
    if (luxuryProperties.length >= 3) {
      sections.push({
        title: 'Luxury Getaways',
        items: luxuryProperties.slice(0, 12),
        filterType: 'category',
        filterValue: 'luxury',
      });
    }

    if (sections.length > 0) {
      return sections;
    } else {
      return [
        {
          title: 'All Properties',
          items: properties.slice(0, 20),
          filterType: 'category',
          filterValue: 'all',
        },
      ];
    }
  }, [properties]);

  return (
    <div className="w-full">
      {isLoading ? (
        // Show loading skeletons while data is being fetched
        <>
          <CarouselSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
        </>
      ) : (
        // Show actual sections when data is loaded
        sections.map((section, idx) => (
          <CarouselSection
            key={`section-${section.filterValue}-${idx}`}
            title={section.title}
            items={section.items}
            filterType={section.filterType}
            filterValue={section.filterValue}
          />
        ))
      )}
    </div>
  );
}

export default HomeSections;
