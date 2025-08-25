// src/redux/mainFormSlice.tsx

import { createSlice } from '@reduxjs/toolkit';

let formState = {
  curSelectInput: '',
  search: false,
  currentMonth: new Date(),
  selectedStartDate: null,
  startDurationDate: new Date(),
  selectedEndDate: null,
  region: 'all',
  dateOption: 'dates',
  adultCount: 0,
  curDot: 3,
  hoverInput: null,
  isSearch: false,
  childCount: 0,
  minimizeFormBtn: '',
  displaySearch: null as any,
  combinedString: [] as any[],
  infantCount: 0,
  petsCount: 0,
  startDateToShow: null,
  endDateToShow: null,
  dateFlexibility: 'exact', // Global flexibility (for backward compatibility)
  startDateFlexibility: 'exact', // Start date specific flexibility
  endDateFlexibility: 'exact', // End date specific flexibility
  openName: '',
  stayDuration: 'week',
  months: [] as number[],
  isCalendarModalOpen: false,
  guestPlural: '',
  petPlural: '',
  destinationInputVal: '',
  displaySearchWeek: '',
  extraGuest: '',
  textForInputDuration: '',
  textForFlexibleInput: '',
  textForGuestInput: '',
  displayGuestInput: '',
  durationDate: '',
  openWhereCard: true,
  openWhenCard: false,
  openWhoCard: false,
};

const formSlice = createSlice({
  name: 'mainForm',
  initialState: formState,
  reducers: {
    clearSearchInputs: (state) => {
      state.destinationInputVal = '';
      state.displaySearch = null;
      state.selectedStartDate = null;
      state.selectedEndDate = null;
      state.startDateToShow = null;
      state.endDateToShow = null;
      state.region = 'all';
      state.dateOption = 'dates';
    },
    setActiveInput: (state, action) => {
      state.curSelectInput = action.payload;
    },
    setOpenName: (state, action) => {
      state.openName = action.payload;
    },
    setCombinedString: (state, action) => {
      state.combinedString = action.payload;
    },
    setOpenWhereCard: (state, action) => {
      state.openWhereCard = action.payload;
    },
    setIsSearch: (state, action) => {
      state.isSearch = action.payload;
    },
    setDurationDate: (state, action) => {
      state.durationDate = action.payload;
    },
    setOpenWhenCard: (state, action) => {
      state.openWhenCard = action.payload;
    },
    setOpenWhoCard: (state, action) => {
      state.openWhoCard = action.payload;
    },
    setSearchEl: (state, action) => {
      state.search = action.payload;
    },
    setCurrentMonth: (state, action) => {
      state.currentMonth = action.payload;
    },
    setSelectedStartDate(state, action) {
      state.selectedStartDate = action.payload;
    },
    setSelectedEndDate(state, action) {
      state.selectedEndDate = action.payload;
    },
    setRegion(state, action) {
      state.region = action.payload;
    },
    setDateOption(state, action) {
      state.dateOption = action.payload;
    },
    setAdultCount(state, action) {
      state.adultCount = action.payload;
    },
    setChildCount(state, action) {
      state.childCount = action.payload;
    },
    setInfantCount(state, action) {
      state.infantCount = action.payload;
    },
    setPetsCount(state, action) {
      state.petsCount = action.payload;
    },
    setCalendarModalOpen(state, action) {
      state.isCalendarModalOpen = action.payload;
    },
    setStartDurationDate(state, action) {
      state.startDurationDate = action.payload;
    },
    setMonths(state, action) {
      if (action.payload === 'empty') {
        state.months = [];
      } else if (state.months.includes(action.payload)) {
        state.months = state.months.filter((month) => month !== action.payload);
      } else {
        state.months.push(action.payload);
      }
    },
    setGuestPlural(state, action) {
      state.guestPlural = action.payload;
    },
    setPetPlural(state, action) {
      state.petPlural = action.payload;
    },
    setExtraGuest(state, action) {
      state.extraGuest = action.payload;
    },
    setStayDuration(state, action) {
      state.stayDuration = action.payload;
    },
    setCurrentDot(state, action) {
      state.curDot = action.payload;
    },
    setDisplaySearch(state, action) {
      state.displaySearch = action.payload;
    },
    setDestinationInputVal(state, action) {
      state.destinationInputVal = action.payload;
    },
    setStartDateToShow(state, action) {
      state.startDateToShow = action.payload;
    },
    setEndDateToShow(state, action) {
      state.endDateToShow = action.payload;
    },
    setDateFlexibility(state, action) {
      state.dateFlexibility = action.payload;
    },
    setStartDateFlexibility(state, action) {
      state.startDateFlexibility = action.payload;
    },
    setEndDateFlexibility(state, action) {
      state.endDateFlexibility = action.payload;
    },
    setDisplaySearchWeek(state, action) {
      state.displaySearchWeek = action.payload;
    },
    setTextForInputDuration(state, action) {
      state.textForInputDuration = action.payload;
    },
    setTextForFlexibleInput(state, action) {
      state.textForFlexibleInput = action.payload;
    },
    setTextForGuestInput(state, action) {
      state.textForGuestInput = action.payload;
    },
    setDisplayGuestInput(state, action) {
      state.displayGuestInput = action.payload;
    },
    setHoverInput(state, action) {
      state.hoverInput = action.payload;
    },
    setMinimizeFormBtn(state, action) {
      state.minimizeFormBtn = action.payload;
    },
  },
});

export const {
  clearSearchInputs,
  setActiveInput,
  setSearchEl,
  setDurationDate,
  setCurrentMonth,
  setSelectedEndDate,
  setMinimizeFormBtn,
  setStartDateToShow,
  setOpenWhereCard,
  setOpenWhenCard,
  setOpenWhoCard,
  setExtraGuest,
  setPetPlural,
  setGuestPlural,
  setCombinedString,
  setTextForInputDuration,
  setEndDateToShow,
  setDateFlexibility,
  setStartDateFlexibility,
  setEndDateFlexibility,
  setDisplaySearch,
  setSelectedStartDate,
  setDisplaySearchWeek,
  setTextForGuestInput,
  setRegion,
  setDateOption,
  setAdultCount,
  setChildCount,
  setInfantCount,
  setHoverInput,
  setPetsCount,
  setOpenName,
  setIsSearch,
  setTextForFlexibleInput,
  setCalendarModalOpen,
  setStartDurationDate,
  setDestinationInputVal,
  setStayDuration,
  setMonths,
  setCurrentDot,
  setDisplayGuestInput,
} = formSlice.actions;
export default formSlice.reducer;
