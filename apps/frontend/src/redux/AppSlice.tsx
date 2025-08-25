import { createSlice } from "@reduxjs/toolkit";

let appState = {
  startScroll: true,
  minimize: false,
  filterData: {} as Record<string, any>,
  selectedIcon: "",
  selectedCountry: "United States",
  isLoading: true,
  city: "",
  hoveredItem: null,
  bookingDate: "",
  hoveredItems: [] as any[],
  hitSearch: 0,
  scrollPositions: {} as Record<string, any>,
  inputSearchIds: [] as any[],
  userData: null,
  showLogin: false,
  userFavListing: [] as any[],
  isFavorite: null,
  itemId: null,
  mobileNavOption: "Explore",
  cancelGuestUpdate: false,
  showMobileForm: false,
  searchResultsCount: 0,
};

const AppSlice = createSlice({
  name: "app",
  initialState: appState,
  reducers: {
    setStartScroll(state, action) {
      state.startScroll = action.payload;
    },
    setMinimize(state, action) {
      state.minimize = action.payload;
    },
    setBookingDate(state, action) {
      state.bookingDate = action.payload;
    },
    setHitSearch(state, action) {
      state.hitSearch = action.payload;
    },
    setFilterData(state, action) {
      state.filterData = { ...state.filterData, ...action.payload };
    },

    setSelectedIcon(state, action) {
      state.selectedIcon = action.payload;
    },
    setSelectedCountry(state, action) {
      state.selectedCountry = action.payload;
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setMobileNavOption(state, action) {
      state.mobileNavOption = action.payload;
    },
    setCity(state, action) {
      state.city = action.payload;
    },
    setHoveredItem(state, action) {
      state.hoveredItem = action.payload;
    },
    setHoveredItems(state, action) {
      state.hoveredItems = action.payload;
    },
    setScrollPositions(state, action) {
      state.scrollPositions = action.payload;
    },
    setShowMobileForm(state, action) {
      state.showMobileForm = action.payload;
    },

    setInputSearchIds(state, action) {
      state.inputSearchIds = action.payload;
    },

    setShowLogin(state, action) {
      state.showLogin = action.payload;
    },

    setUserData(state, action) {
      state.userData = action.payload;
    },
    setCancelGuestUpdate(state, action) {
      state.cancelGuestUpdate = action.payload;
    },

    setUserFavListing(state, action) {
      // Normalize action.payload to always be an array
      const items = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      // Merge new items with the existing list without duplicates
      const uniqueItems = new Set([...state.userFavListing, ...items]);

      return {
        ...state,
        userFavListing: Array.from(uniqueItems),
      };
    },
    removeUserFavListing(state, action) {
      state.userFavListing = state.userFavListing.filter(
        (item) => item !== action.payload
      );
    },
    setIsFavorite(state, action) {
      state.isFavorite = action.payload;
    },
    setItemId(state, action) {
      state.itemId = action.payload;
    },
    setSearchResultsCount(state, action) {
      state.searchResultsCount = action.payload;
    },
  },
});

export const {
  setStartScroll,
  setMinimize,
  setUserData,
  setMobileNavOption,
  setIsFavorite,
  setFilterData,
  setSelectedIcon,
  setCancelGuestUpdate,
  setShowMobileForm,
  setUserFavListing,
  setItemId,
  setBookingDate,
  setHitSearch,
  removeUserFavListing,
  setIsLoading,
  setSelectedCountry,
  setShowLogin,
  setHoveredItem,
  setHoveredItems,
  setScrollPositions,
  setCity,
  setInputSearchIds,
  setSearchResultsCount,
} = AppSlice.actions;

export default AppSlice.reducer;
