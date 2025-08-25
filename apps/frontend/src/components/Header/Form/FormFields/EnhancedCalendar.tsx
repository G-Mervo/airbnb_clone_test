import React, { useState } from 'react';
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
import {
  setActiveInput,
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setEndDateToShow,
} from '../../../../redux/mainFormSlice';

interface EnhancedCalendarProps {
  onDateSelect?: (startDate: Date | null, endDate: Date | null) => void;
}

const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({ onDateSelect }) => {
  const dispatch = useDispatch();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const selectedStartDate = useSelector((store: any) => store.form.selectedStartDate);
  const selectedEndDate = useSelector((store: any) => store.form.selectedEndDate);
  const dateFlexibility = useSelector((store: any) => store.form.dateFlexibility);

  const currentMonth = new Date();

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

        // Date selection logic
        const isStartDate = selectedStartDate && isSameDay(day, selectedStartDate);
        const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);
        const isInRange =
          selectedStartDate &&
          selectedEndDate &&
          isWithinInterval(day, { start: selectedStartDate, end: selectedEndDate });

        let onClickHandler: (() => void) | null = () => {
          if (!isPastDate && isCurrentMonth) {
            handleDateClick(cloneDay);
          }
        };

        // Styling logic
        if (!isCurrentMonth) {
          cellClass = 'text-gray-300 cursor-default';
          onClickHandler = null;
        } else if (isPastDate) {
          cellClass = 'text-gray-300 cursor-default';
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
        } else {
          cellClass = 'text-black hover:bg-gray-100 cursor-pointer';
        }

        days.push(
          <div key={day.toString()} className="relative w-12 h-12 flex items-center justify-center">
            <div
              className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-200 ${cellClass}`}
              onClick={onClickHandler || undefined}
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

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // First click or reset: set start date
      const startDateFormatted = format(day, 'MMM dd');
      const startDateText = startDateFormatted + flexibilityText;

      dispatch(setSelectedStartDate(day));
      dispatch(setSelectedEndDate(null));
      // DISABLED: Prevent immediate display updates that could trigger API calls
      // Display updates will happen when submit button is clicked
      // dispatch(setStartDateToShow(startDateText));
      // dispatch(setEndDateToShow(null));
      dispatch(setActiveInput('checkOut'));
    } else if (selectedStartDate && !selectedEndDate) {
      // Second click: set end date
      if (day < selectedStartDate) {
        // If selected date is before start date, make it the new start date
        const newStartDateFormatted = format(day, 'MMM dd');
        const newStartDateText = newStartDateFormatted + flexibilityText;

        dispatch(setSelectedStartDate(day));
        dispatch(setSelectedEndDate(null));
        // DISABLED: Prevent immediate display updates that could trigger API calls
        // dispatch(setStartDateToShow(newStartDateText));
        // dispatch(setEndDateToShow(null));
        dispatch(setActiveInput('checkOut'));
      } else {
        // Set as end date
        const endDateFormatted = format(day, 'MMM dd');
        const endDateText = endDateFormatted + flexibilityText;

        dispatch(setSelectedEndDate(day));
        // DISABLED: Prevent immediate display updates that could trigger API calls
        // dispatch(setEndDateToShow(endDateText));
        if (onDateSelect) {
          onDateSelect(selectedStartDate, day);
        }
      }
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
    <div className="flex flex-col w-full bg-white rounded-lg shadow-sm border border-gray-100">
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
    </div>
  );
};

export default EnhancedCalendar;
