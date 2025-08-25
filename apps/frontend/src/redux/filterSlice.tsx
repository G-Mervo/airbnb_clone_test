import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FilterState {
  // Price range
  minPrice: number;
  maxPrice: number;

  // Place type
  placeType: 'Any type' | 'Room' | 'Entire home';

  // Rooms and beds
  bedrooms: string; // "Any" or number as string
  beds: string; // "Any" or number as string
  bathrooms: string; // "Any" or number as string

  // Amenities
  selectedAmenities: string[];
  selectedRecommended: string[];

  // Booking options
  selectedBookingOptions: string[];

  // Property types
  selectedPropertyTypes: string[];

  // Accessibility features
  selectedAccessibilityFeatures: string[];

  // Host languages
  selectedHostLanguages: string[];

  // Standout stays
  selectedStandoutStays: string[];

  // Display options
  showTotalBeforeTaxes: boolean;
  adults: number;
  startDate: string;
  endDate: string;
}

const initialState: FilterState = {
  minPrice: 0,
  maxPrice: 800,
  placeType: 'Any type',
  bedrooms: 'Any',
  beds: 'Any',
  bathrooms: 'Any',
  selectedAmenities: [],
  selectedRecommended: [],
  selectedBookingOptions: [],
  selectedPropertyTypes: [],
  selectedAccessibilityFeatures: [],
  selectedHostLanguages: [],
  selectedStandoutStays: [],
  showTotalBeforeTaxes: false,
  adults: 0,
  startDate: '',
  endDate: '',
};

interface PresetFilterPayload {
  filterType: 'category' | 'propertyType';
  filterValue: string;
}

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.minPrice = action.payload.min;
      state.maxPrice = action.payload.max;
    },
    setPlaceType: (state, action: PayloadAction<FilterState['placeType']>) => {
      state.placeType = action.payload;
    },
    setRoomCount: (
      state,
      action: PayloadAction<{ type: 'bedrooms' | 'beds' | 'bathrooms'; value: string }>,
    ) => {
      const { type, value } = action.payload;
      state[type] = value;
    },
    toggleAmenity: (state, action: PayloadAction<string>) => {
      const amenity = action.payload;
      if (state.selectedAmenities.includes(amenity)) {
        state.selectedAmenities = state.selectedAmenities.filter((a) => a !== amenity);
      } else {
        state.selectedAmenities.push(amenity);
      }
    },
    toggleRecommended: (state, action: PayloadAction<string>) => {
      const item = action.payload;
      if (state.selectedRecommended.includes(item)) {
        state.selectedRecommended = state.selectedRecommended.filter((r) => r !== item);
      } else {
        state.selectedRecommended.push(item);
      }
    },
    toggleBookingOption: (state, action: PayloadAction<string>) => {
      const option = action.payload;
      if (state.selectedBookingOptions.includes(option)) {
        state.selectedBookingOptions = state.selectedBookingOptions.filter((o) => o !== option);
      } else {
        state.selectedBookingOptions.push(option);
      }
    },
    togglePropertyType: (state, action: PayloadAction<string>) => {
      const type = action.payload;
      if (state.selectedPropertyTypes.includes(type)) {
        state.selectedPropertyTypes = state.selectedPropertyTypes.filter((t) => t !== type);
      } else {
        state.selectedPropertyTypes.push(type);
      }
    },
    toggleAccessibilityFeature: (state, action: PayloadAction<string>) => {
      const feature = action.payload;
      if (state.selectedAccessibilityFeatures.includes(feature)) {
        state.selectedAccessibilityFeatures = state.selectedAccessibilityFeatures.filter(
          (f) => f !== feature,
        );
      } else {
        state.selectedAccessibilityFeatures.push(feature);
      }
    },
    toggleHostLanguage: (state, action: PayloadAction<string>) => {
      const language = action.payload;
      if (state.selectedHostLanguages.includes(language)) {
        state.selectedHostLanguages = state.selectedHostLanguages.filter((l) => l !== language);
      } else {
        state.selectedHostLanguages.push(language);
      }
    },
    toggleStandoutStay: (state, action: PayloadAction<string>) => {
      const stay = action.payload;
      if (state.selectedStandoutStays.includes(stay)) {
        state.selectedStandoutStays = state.selectedStandoutStays.filter((s) => s !== stay);
      } else {
        state.selectedStandoutStays.push(stay);
      }
    },
    setShowTotalBeforeTaxes: (state, action: PayloadAction<boolean>) => {
      state.showTotalBeforeTaxes = action.payload;
    },
    clearAllFilters: (state) => {
      return { ...initialState, showTotalBeforeTaxes: state.showTotalBeforeTaxes };
    },

    applyPresetFilter(state, action: PayloadAction<PresetFilterPayload>) {
      const { filterType, filterValue } = action.payload;

      if (filterType === 'category') {
        switch (filterValue) {
          case 'highly-rated':
            state.selectedStandoutStays = ['guest-favorite'];
            break;
          case 'budget':
            state.maxPrice = 150;
            break;
          case 'luxury':
            state.minPrice = 300;
            break;
        }
      } else if (filterType === 'propertyType') {
        const propertyTypeMap: { [key: string]: string } = {
          House: 'house',
          Apartment: 'apartment',
          Condo: 'apartment',
          Villa: 'house',
          Cabin: 'house',
          Loft: 'apartment',
          Guesthouse: 'guesthouse',
          Hotel: 'hotel',
        };
        const filterKey = propertyTypeMap[filterValue] || '';
        if (filterKey) {
          state.selectedPropertyTypes = [filterKey];
        }
      }
    },
  },
});

export const {
  setPriceRange,
  setPlaceType,
  setRoomCount,
  toggleAmenity,
  toggleRecommended,
  toggleBookingOption,
  togglePropertyType,
  toggleAccessibilityFeature,
  toggleHostLanguage,
  toggleStandoutStay,
  setShowTotalBeforeTaxes,
  clearAllFilters,
  applyPresetFilter,
} = filterSlice.actions;

export default filterSlice.reducer;
