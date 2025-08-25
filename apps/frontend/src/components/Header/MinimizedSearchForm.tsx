// @ts-nocheck
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { setMinimize, setHitSearch } from '../../redux/AppSlice';
import {
  setActiveInput,
  setOpenName,
  setMinimizeFormBtn,
  setDestinationInputVal,
  setSelectedStartDate,
  setSelectedEndDate,
  setAdultCount,
  setChildCount,
  setInfantCount,
  setPetsCount,
} from '../../redux/mainFormSlice';
import { handleSearch } from '../../hooks/MainFormContent';
import { handleSearchInput } from '../Header/Form/HandleSearch';
import houseIcon from '../../asset/house.png';

const MinimizedSearchForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formState = useSelector((store: any) => store.form);
  const { displaySearch, displaySearchWeek, displayGuestInput } = formState;
  const { hitSearch } = useSelector((store: any) => store.app);

  const handleClick = (type: string) => {
    dispatch(setMinimize(true));
    dispatch(setMinimizeFormBtn(type));
    dispatch(
      setActiveInput(
        type === 'anywhere' ? 'destination' : type === 'week' ? 'checkIn' : 'addGuest',
      ),
    );
    setTimeout(
      () =>
        dispatch(
          setOpenName(
            type === 'anywhere' ? 'destination' : type === 'week' ? 'checkIn' : 'addGuest',
          ),
        ),
      200,
    );
  };

  const handleSearchClick = () => {
    const {
      region,
      dateOption,
      startDateToShow,
      endDateToShow,
      selectedStartDate,
      selectedEndDate,
      destinationInputVal,
      textForInputDuration,
      textForFlexibleInput,
      textForGuestInput,
      combinedString,
      adultCount,
      childCount,
      infantCount,
      petsCount,
    } = formState;

    dispatch(setHitSearch(hitSearch + 1));

    // Ensure all form state is updated to trigger the SearchResults query
    if (destinationInputVal) {
      dispatch(setDestinationInputVal(destinationInputVal));
    }
    if (selectedStartDate) {
      dispatch(setSelectedStartDate(selectedStartDate));
    }
    if (selectedEndDate) {
      dispatch(setSelectedEndDate(selectedEndDate));
    }
    if (adultCount) {
      dispatch(setAdultCount(adultCount));
    }
    if (childCount) {
      dispatch(setChildCount(childCount));
    }
    if (infantCount) {
      dispatch(setInfantCount(infantCount));
    }
    if (petsCount) {
      dispatch(setPetsCount(petsCount));
    }

    handleSearch({
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
    });

    handleSearchInput(region, destinationInputVal, combinedString, dispatch);

    // Navigate to search results page only if not already there
    if (window.location.pathname !== '/search') {
      navigate('/search');
    } else {
      // If already on search page, just trigger a refresh by updating the search state
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 h-11">
        <button
          onClick={() => handleClick('anywhere')}
          className="flex items-center pl-2 pr-4 h-full rounded-l-full transition-colors duration-200"
        >
          <img src={houseIcon} alt="Homes" className="w-[48px] h-[48px] mr-2" />
          <div className="text-sm font-semibold text-gray-800 max-w-[240px] truncate">
            {displaySearch || 'Anywhere'}
          </div>
        </button>

        <div className="w-px h-6 bg-gray-300"></div>
        <button
          onClick={() => handleClick('week')}
          className="flex items-center px-4 h-full transition-colors duration-200"
        >
          <div className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">
            {displaySearchWeek || 'Any weekend'}
          </div>
        </button>

        <div className="w-px h-6 bg-gray-300"></div>

        <button
          onClick={() => handleClick('guest')}
          className="flex items-center pl-4 pr-12 h-full rounded-r-full transition-colors duration-200 relative"
        >
          <div className={`text-sm max-w-[120px] truncate font-semibold text-gray-800 mr-2`}>
            {displayGuestInput || 'Add guests'}
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSearchClick();
              }}
              className="flex items-center justify-center w-8 h-8 bg-[#ff385c] hover:bg-red-600 text-white rounded-full transition-colors duration-200"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MinimizedSearchForm;
