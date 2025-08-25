import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  isWithinInterval,
} from 'date-fns';
import arrowRight from '../../../../asset/Icons_svg/arrow-right.svg';
import arrowLeft from '../../../../asset/Icons_svg/arrow-left.svg';
import { useDispatch, useSelector } from 'react-redux';
import MonthDateFlexibility from './MonthDateFlexibility';
import {
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setEndDateToShow,
  setStartDurationDate,
  setCurrentDot,
} from '../../../../redux/mainFormSlice';

interface CircularSliderCalendarProps {
  onDateSelect?: (startDate: Date | null, endDate: Date | null) => void;
  editMode?: 'startDate' | 'endDate'; // Which field is being edited
}

const CircularSliderCalendar: React.FC<CircularSliderCalendarProps> = ({
  onDateSelect,
  editMode = 'startDate', // Default to startDate if not specified
}) => {
  const dispatch = useDispatch();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const selectedStartDate = useSelector((store: any) => store.form.selectedStartDate);
  const selectedEndDate = useSelector((store: any) => store.form.selectedEndDate);
  const dateFlexibility = useSelector((store: any) => store.form.dateFlexibility);

  const currentMonth = new Date();

  // Update date display when flexibility changes
  // DISABLED: Prevent automatic display updates when dates change
  // This prevents unnecessary Redux state updates that could trigger API calls
  // Display updates should only happen when search is submitted
  /*
  useEffect(() => {
    if (selectedStartDate) {
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = dateFlexibility === 'exact' ? '' : ` ±${dateFlexibility}`;
      const startDateText = startDateFormatted + flexibilityText;
      dispatch(setStartDateToShow(startDateText));
    }

    if (selectedEndDate) {
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = dateFlexibility === 'exact' ? '' : ` ±${dateFlexibility}`;
      const endDateText = endDateFormatted + flexibilityText;
      dispatch(setEndDateToShow(endDateText));
    }
  }, [dateFlexibility, selectedStartDate, selectedEndDate, dispatch]);
  */

  const renderDays = () => {
    const dateFormat = 'eee';
    const days = [];
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(
        <div
          className="flex w-12 justify-center text-xs text-center font-medium text-gray-500 mb-2"
          key={format(day, 'yyyy-MM-dd')}
        >
          {format(day, dateFormat)}
        </div>,
      );
    }

    return <div className="flex justify-center items-center mb-4">{days}</div>;
  };

  const renderCells = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = new Date();

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = new Date(day);
        let cellClass = '';

        // Determine if the day is in the past and within the current month
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isPastDate = isSameMonth(day, monthStart) && day < todayAtMidnight;
        const isCurrentMonth = isSameMonth(day, monthStart);

        // Date selection logic - edit mode specific
        const isStartDate = selectedStartDate && isSameDay(day, selectedStartDate);
        const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);
        const isInRange =
          selectedStartDate &&
          selectedEndDate &&
          isWithinInterval(day, { start: selectedStartDate, end: selectedEndDate });
        const isSelectedDate = editMode === 'startDate' ? isStartDate : isEndDate;

        // For end date editing: disable dates that are before or equal to start date
        const isInvalidEndDate =
          editMode === 'endDate' && selectedStartDate && day <= selectedStartDate;

        let onClickHandler: (() => void) | null = () => {
          if (!isPastDate && isCurrentMonth && !isInvalidEndDate) {
            handleDateClick(cloneDay);
          }
        };

        // Styling logic - edit mode specific
        if (!isCurrentMonth) {
          cellClass = 'text-gray-300 cursor-default';
          onClickHandler = null;
        } else if (isPastDate) {
          cellClass = 'text-gray-300 cursor-default';
          onClickHandler = null;
        } else if (isInvalidEndDate) {
          // Invalid end date (before or equal to start date)
          cellClass = 'text-gray-300 cursor-not-allowed bg-gray-100';
          onClickHandler = null;
        } else if (isStartDate && isEndDate) {
          // Same day selected for both start and end
          cellClass = 'bg-black text-white rounded-full';
        } else if (isStartDate) {
          cellClass = 'bg-black text-white rounded-full';
        } else if (isEndDate) {
          cellClass = 'bg-black text-white rounded-full';
        } else if (isInRange) {
          cellClass = 'bg-gray-200 text-black';
        } else if (isSelectedDate) {
          // Currently editing this field
          cellClass = 'bg-blue-600 text-white rounded-full';
        } else {
          cellClass = 'text-black hover:bg-gray-100 cursor-pointer';
        }

        days.push(
          <div key={day.toString()} className="relative w-12 h-12 flex items-center justify-center">
            <div
              className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-200 ${cellClass}`}
              onClick={onClickHandler || undefined}
              title={isInvalidEndDate ? 'End date must be after start date' : ''}
            >
              <span className="z-20">{formattedDate}</span>
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex items-center justify-center w-full" key={day.toString()}>
          {days}
        </div>,
      );

      days = [];
    }
    return <div className="flex flex-col w-full justify-between items-stretch">{rows}</div>;
  };

  const handleDateClick = (day: Date) => {
    const flexibilityText = dateFlexibility === 'exact' ? '' : ` ±${dateFlexibility}`;

    if (editMode === 'startDate') {
      // Editing start date
      const dateFormatted = format(day, 'MMM dd');
      const dateText = dateFormatted + flexibilityText;

      dispatch(setSelectedStartDate(day));
      dispatch(setStartDateToShow(dateText));
      // Don't change active input - keep Month modal open
      // dispatch(setActiveInput('checkIn'));

      // Update CircularSlider state
      dispatch(setStartDurationDate(day));

      // Reset currentDot to 1 (1 month) since we're selecting a new start date
      dispatch(setCurrentDot(1));
    } else if (editMode === 'endDate') {
      // Editing end date - validate it's after start date
      if (selectedStartDate && day <= selectedStartDate) {
        // End date must be after start date
        console.log('End date must be after start date');
        return; // Don't allow selection of invalid end date
      }

      const dateFormatted = format(day, 'MMM dd');
      const dateText = dateFormatted + flexibilityText;

      dispatch(setSelectedEndDate(day));
      dispatch(setEndDateToShow(dateText));
      // Don't change active input - keep Month modal open
      // dispatch(setActiveInput('checkOut'));

      // Calculate months difference for CircularSlider if start date exists
      if (selectedStartDate) {
        const monthsDiff = Math.ceil(
          (day.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        );
        const dotIndex = monthsDiff === 0 ? 1 : monthsDiff;
        dispatch(setCurrentDot(dotIndex));
      }
    }

    // Don't auto-close - let user confirm with Save button
    // The modal should stay open until user explicitly closes it

    if (onDateSelect) {
      onDateSelect(selectedStartDate, editMode === 'endDate' ? day : selectedEndDate);
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    } else if (direction === 'next' && currentMonthIndex < 10) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Two-month view */}
      <div className="flex">
        {/* First month */}
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={currentMonthIndex === 0}
              className={`p-2 rounded-full transition-colors ${
                currentMonthIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <img className="h-4 w-4" src={arrowLeft} alt="Previous" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-lg font-semibold text-gray-900">
                {format(addMonths(currentMonth, currentMonthIndex), 'MMMM yyyy')}
              </span>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>
          {renderDays()}
          {renderCells(addMonths(currentMonth, currentMonthIndex))}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200 mx-2"></div>

        {/* Second month */}
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10"></div> {/* Spacer for balance */}
            <div className="flex-1 text-center">
              <span className="text-lg font-semibold text-gray-900">
                {format(addMonths(currentMonth, currentMonthIndex + 1), 'MMMM yyyy')}
              </span>
            </div>
            <button
              onClick={() => handleNavigation('next')}
              disabled={currentMonthIndex >= 10}
              className={`p-2 rounded-full transition-colors ${
                currentMonthIndex >= 10 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <img className="h-4 w-4" src={arrowRight} alt="Next" />
            </button>
          </div>
          {renderDays()}
          {renderCells(addMonths(currentMonth, currentMonthIndex + 1))}
        </div>
      </div>

      {/* AddDays component for date flexibility */}
      <div className="border-gray-200 pt-6 px-6 pb-6">
        <MonthDateFlexibility editMode={editMode} />
      </div>
    </div>
  );
};

export default CircularSliderCalendar;
