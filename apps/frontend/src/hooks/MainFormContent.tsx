// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, addDays, subDays } from 'date-fns';

import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveInput,
  setAdultCount,
  setChildCount,
  setCombinedString,
  setDestinationInputVal,
  setDisplayGuestInput,
  setDisplaySearch,
  setDisplaySearchWeek,
  setEndDateToShow,
  setExtraGuest,
  setGuestPlural,
  setInfantCount,
  setMinimizeFormBtn,
  setOpenName,
  setPetPlural,
  setPetsCount,
  setRegion,
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setTextForGuestInput,
} from '../redux/mainFormSlice';

import { useIsFetching, useQueryClient } from '@tanstack/react-query';

import { useMinimizeFormOnOutsideClick } from '../components/Header/Form/MinimizeFormHook';

import SearchForm from '../components/Header/Form/SearchForm';

const useGuestCount = ({
  adultCount,
  childCount,
  petCount,
  infantCount,
  petPlural,
  dispatch,
  setGuestPlural,
  setPetPlural,
  setExtraGuest,
}) => {
  useEffect(() => {
    const primaryGuestCount = childCount + adultCount;
    const secondaryGuestCount = petCount + infantCount;

    if (primaryGuestCount === 1 && secondaryGuestCount === 0) {
      dispatch(setGuestPlural(''));
    } else if (primaryGuestCount > 1 && secondaryGuestCount === 0) {
      dispatch(setGuestPlural('s'));
    } else if (primaryGuestCount > 1 && secondaryGuestCount > 0) {
      dispatch(setGuestPlural('s,'));
    } else if (primaryGuestCount === 1 && secondaryGuestCount > 0) {
      dispatch(setGuestPlural(','));
    }

    dispatch(setPetPlural(petCount > 1 ? 's' : ''));

    if (infantCount > 0) {
      dispatch(setExtraGuest(`${infantCount} infant`));
    } else if (petCount > 0) {
      dispatch(setExtraGuest(`${petCount} pet${petPlural}`));
    }
  }, [
    adultCount,
    childCount,
    petCount,
    infantCount,
    petPlural,
    dispatch,
    setGuestPlural,
    setPetPlural,
    setExtraGuest,
  ]);
};

const useAutoFocus = (inputRef, region, selectedInput) => {
  useEffect(() => {
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
      inputRef.current.focus();
    }
    if (selectedInput !== 'destination') {
      inputRef.current?.blur();
    }
  }, [region, inputRef, selectedInput]);
};

export const useHandleCrossClick = () => {
  const dispatch = useDispatch();

  const handleCrossClick = useCallback(
    (e, inputField) => {
      e.stopPropagation();

      switch (inputField) {
        case 'destination':
          dispatch(setRegion('all'));
          dispatch(setDestinationInputVal(null));
          break;

        case 'checkIn':
        case 'checkOut':
          dispatch(setSelectedStartDate(null));
          dispatch(setSelectedEndDate(null));
          // Also clear display dates since we disabled automatic updates
          dispatch(setStartDateToShow(''));
          dispatch(setEndDateToShow(''));
          dispatch(setActiveInput('checkIn'));
          dispatch(setOpenName('checkIn'));
          break;

        case 'guest':
          dispatch(setAdultCount(0));
          dispatch(setChildCount(0));
          dispatch(setInfantCount(0));
          dispatch(setPetsCount(0));
          break;

        default:
          dispatch(setDestinationInputVal(null));
          break;
      }
    },
    [dispatch],
  );

  return handleCrossClick;
};

const useFormattedDates = () => {
  const dispatch = useDispatch();
  const { selectedStartDate, selectedEndDate } = useSelector((store: any) => store.form);

  // DISABLED: This was overriding the calendar's display format
  // The calendar should control the display format when dates are selected
  // This useEffect was changing "Aug 23 ±1" to "23 Aug" (wrong format, no flexibility)
  /*
  const formattedStartDate = useMemo(
    () => (selectedStartDate ? format(new Date(selectedStartDate), 'dd MMM') : ''),
    [selectedStartDate],
  );

  const formattedEndDate = useMemo(
    () => (selectedEndDate ? format(new Date(selectedEndDate), 'dd MMM') : ''),
    [selectedEndDate],
  );

  useEffect(() => {
    dispatch(setStartDateToShow(formattedStartDate));
    dispatch(setEndDateToShow(formattedEndDate));
  }, [dispatch, formattedStartDate, formattedEndDate]);
  */
};

const useProcessCombinedString = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['allRows'] });

  const [cachedData, setCachedData] = useState(null);

  useEffect(() => {
    const data = queryClient.getQueryData(['allRows']);
    setCachedData(data);
  }, [queryClient, isFetching]);

  useEffect(() => {
    let resultArray = [];

    if (cachedData) {
      cachedData.forEach((item) => {
        let combinedString = `${item.city}${item.country}${item['house-title']}`;
        combinedString = combinedString.replace(/[^a-zA-Z0-9]/g, '');
        const newObj = {
          [item.id]: combinedString,
        };
        resultArray.push(newObj);
      });
      dispatch(setCombinedString(resultArray));
    }
  }, [cachedData, dispatch]);
};

const useGuestInputText = (curSelectInput) => {
  const dispatch = useDispatch();
  const { adultCount, childCount, petCount, infantCount, petPlural, extraGuest, guestPlural } =
    useSelector((store: any) => store.form);
  useEffect(() => {
    let textForGuestInput = `${
      adultCount + childCount > 0 && curSelectInput
        ? `${adultCount + childCount} guest${adultCount + childCount >= 2 ? 's' : ''}`
        : 'Add guest'
    }`;

    dispatch(setTextForGuestInput(textForGuestInput));
  }, [
    adultCount,
    dispatch,
    childCount,
    curSelectInput,
    infantCount,
    petCount,
    petPlural,
    extraGuest,
    guestPlural,
  ]);
};

const MainFormContent = () => {
  const dispatch = useDispatch();
  const modalRef = useRef();
  const buttonRef = useRef();
  const checkInRef = useRef();
  const checkOutRef = useRef();
  const addGuestRef = useRef();
  const flexibleRef = useRef();
  const monthRef = useRef();
  const inputRef = useRef(null);

  const {
    curSelectInput,
    petPlural,
    selectedStartDate,
    selectedEndDate,
    region,
    adultCount,
    childCount,
    infantCount,
    petsCount: petCount,
    isCalendarModalOpen,
  } = useSelector((store: any) => store.form);

  useGuestCount({
    adultCount,
    childCount,
    petCount,
    infantCount,
    petPlural,
    dispatch,
    setGuestPlural,
    setPetPlural,
    setExtraGuest,
  });

  useAutoFocus(inputRef, region, curSelectInput);
  useFormattedDates();

  useMinimizeFormOnOutsideClick(
    {
      modalRef,
      buttonRef,
      checkInRef,
      checkOutRef,
      addGuestRef,
      monthRef,
      flexibleRef,
    },
    isCalendarModalOpen,
    selectedStartDate,
    selectedEndDate,
  );

  useProcessCombinedString();
  useGuestInputText(curSelectInput);

  useEffect(() => {
    // Only close the modal if curSelectInput is empty AND we're not in calendar mode
    // This prevents the Month modal from closing when the calendar modal opens
    if (!curSelectInput && !isCalendarModalOpen) {
      console.log('MainFormContent: Closing modal - curSelectInput empty and not in calendar mode');
      dispatch(setOpenName(''));
    } else if (!curSelectInput && isCalendarModalOpen) {
      console.log('MainFormContent: NOT closing modal - curSelectInput empty but in calendar mode');
    }
  }, [curSelectInput, isCalendarModalOpen, dispatch]);

  function handleInputField(target, input) {
    console.log('MainFormContent: handleInputField called with:', {
      input,
      curSelectInput,
      isCalendarModalOpen,
    });
    dispatch(setMinimizeFormBtn(''));
    if (curSelectInput === input) {
      // Don't close the modal when clicking the same input
      // This prevents the Month modal from closing when clicking inside it
      console.log('MainFormContent: Same input clicked, keeping modal open');
      // dispatch(setActiveInput(''));
    } else {
      console.log('MainFormContent: Different input clicked, changing active input');
      dispatch(setActiveInput(input));
    }
  }

  return (
    <SearchForm
      handleInputField={handleInputField}
      buttonRef={buttonRef}
      inputRef={inputRef}
      modalRef={modalRef}
      checkInRef={checkInRef}
      checkOutRef={checkOutRef}
      monthRef={monthRef}
      flexibleRef={flexibleRef}
      addGuestRef={addGuestRef}
    />
  );
};

export default MainFormContent;

export function handleSearch({
  region,
  dispatch,
  dateOption,
  startDateToShow,
  endDateToShow,
  selectedStartDate,
  selectedEndDate,
  destinationInputVal,
  textForInputDuration,
  textForFlexibleInput,
  textForGuestInput,
  dateFlexibility,
}) {
  if (region !== 'all') {
    dispatch(setDisplaySearch(region));
  } else {
    dispatch(setDisplaySearch(destinationInputVal));
  }

  if (dateOption === 'dates') {
    // Apply date flexibility to the actual search dates
    let searchStartDate = selectedStartDate;
    let searchEndDate = selectedEndDate;

    if (dateFlexibility !== 'exact' && (selectedStartDate || selectedEndDate)) {
      const flexibilityDays = parseInt(dateFlexibility);

      if (selectedStartDate) {
        // For check-in: allow dates within ±flexibilityDays of the selected date
        const startDate = new Date(selectedStartDate);
        const minStartDate = new Date(startDate);
        minStartDate.setDate(minStartDate.getDate() - flexibilityDays);
        const maxStartDate = new Date(startDate);
        maxStartDate.setDate(maxStartDate.getDate() + flexibilityDays);

        // Use the earliest possible start date for search
        searchStartDate = minStartDate;

        // Update display to show the range
        const startDateText = `${format(minStartDate, 'MMM dd')} - ${format(
          maxStartDate,
          'MMM dd',
        )} ±${dateFlexibility}`;
        dispatch(setStartDateToShow(startDateText));
      }

      if (selectedEndDate) {
        // For check-out: allow dates within ±flexibilityDays of the selected date
        const endDate = new Date(selectedEndDate);
        const minEndDate = new Date(endDate);
        minEndDate.setDate(minEndDate.getDate() - flexibilityDays);
        const maxEndDate = new Date(endDate);
        maxEndDate.setDate(maxEndDate.getDate() + flexibilityDays);

        // Use the latest possible end date for search
        searchEndDate = maxEndDate;

        // Update display to show the range
        const endDateText = `${format(minEndDate, 'MMM dd')} - ${format(
          maxEndDate,
          'MMM dd',
        )} ±${dateFlexibility}`;
        dispatch(setEndDateToShow(endDateText));
      }
    } else {
      // Exact dates - no flexibility
      if (selectedStartDate) {
        const startDateFormatted = format(selectedStartDate, 'MMM dd');
        dispatch(setStartDateToShow(startDateFormatted));
      }

      if (selectedEndDate) {
        const endDateFormatted = format(selectedEndDate, 'MMM dd');
        dispatch(setEndDateToShow(endDateFormatted));
      }
    }

    if (startDateToShow && !endDateToShow) {
      let endDate = addDays(selectedStartDate, 1);
      dispatch(setSelectedEndDate(endDate));

      let inputText = `${startDateToShow} - ${format(endDate, 'dd MMM')}`;
      dispatch(setDisplaySearchWeek(inputText));
    } else if (!startDateToShow && endDateToShow) {
      let startDate = subDays(selectedEndDate, 1);
      dispatch(setSelectedStartDate(startDate));

      let inputText = `${format(startDate, 'dd MMM')} - ${endDateToShow}`;
      dispatch(setDisplaySearchWeek(inputText));
    } else if (startDateToShow && endDateToShow) {
      let inputText = `${startDateToShow} - ${endDateToShow}`;
      dispatch(setDisplaySearchWeek(inputText));
    } else {
      dispatch(setDisplaySearchWeek(''));
    }
  } else if (dateOption === 'month') {
    if (textForInputDuration) {
      dispatch(setDisplaySearchWeek(textForInputDuration));
    } else {
      dispatch(setDisplaySearchWeek(''));
    }
  } else if (dateOption === 'flexible') {
    if (textForFlexibleInput) {
      dispatch(setDisplaySearchWeek(textForFlexibleInput));
    } else {
      dispatch(setDisplaySearchWeek(''));
    }
  }

  if (textForGuestInput) {
    dispatch(setDisplayGuestInput(textForGuestInput));
  }
}
