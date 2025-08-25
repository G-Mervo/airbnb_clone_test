// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, addMonths } from 'date-fns';
import CalendarModal from './CalendarModal';
import Calendar from './FormFields/Calendar';
import {
  setCalendarModalOpen,
  setCurrentDot,
  setDurationDate,
  setStartDurationDate,
} from '../../../redux/mainFormSlice';

const TOTAL_DOTS = 12;
const SMALL_SCREEN_BREAKPOINT = '(max-width: 743px)';

const CircularSlider = ({
  onOpenCalendar,
}: {
  onOpenCalendar: (dateType: 'startDate' | 'endDate') => void;
}) => {
  const dispatch = useDispatch();
  const [hoveredDot, setHoveredDot] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    curDot: currentDot,
    startDurationDate,
    selectedStartDate,
    selectedEndDate,
    dateFlexibility,
  } = useSelector((store: any) => store.form);

  const endDurationDate = useMemo(
    () => addMonths(startDurationDate, currentDot === 0 ? TOTAL_DOTS : currentDot),
    [startDurationDate, currentDot],
  );

  const formattedStartDate = format(startDurationDate, 'MMM dd, yyyy');
  const formattedEndDate = format(endDurationDate, 'MMM dd, yyyy');

  useEffect(() => {
    const formattedDuration = `${format(startDurationDate, 'MMM dd')} to ${format(
      endDurationDate,
      'MMM dd',
    )}`;
    dispatch(setDurationDate(formattedDuration));
  }, [startDurationDate, endDurationDate, dispatch]);

  // Watch for changes in selected dates from calendar and update CircularSlider state
  useEffect(() => {
    if (selectedStartDate) {
      // Update startDurationDate to match selectedStartDate
      dispatch(setStartDurationDate(selectedStartDate));

      // For single date selection, keep currentDot as is (user can adjust with circular slider)
      // Don't reset currentDot here - let user control it with the circular slider
    }

    // If both dates are selected, calculate duration for CircularSlider
    if (selectedStartDate && selectedEndDate) {
      const monthsDiff = Math.ceil(
        (selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      );
      const dotIndex = monthsDiff === 0 ? 1 : monthsDiff;
      dispatch(setCurrentDot(dotIndex));
    }
  }, [selectedStartDate, selectedEndDate, dispatch]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SMALL_SCREEN_BREAKPOINT);
    setIsSmallScreen(mediaQuery.matches);

    const handleResize = (event: MediaQueryListEvent) => setIsSmallScreen(event.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const handleDotClick = (index: number) => dispatch(setCurrentDot(index));
  const handleEditClick = (dateType: 'startDate' | 'endDate') => {
    onOpenCalendar(dateType);
  };

  // Utilities to convert pointer position to angle/month index
  const clientPointToAngle = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const angleToIndex = (angle: number) => {
    const step = 360 / TOTAL_DOTS;
    let idx = Math.round(angle / step) % TOTAL_DOTS;
    if (idx === TOTAL_DOTS) idx = 0;
    return idx;
  };

  const startDrag = (startClientX: number, startClientY: number) => {
    const move = (e: MouseEvent) => {
      const ang = clientPointToAngle(e.clientX, e.clientY);
      if (ang != null) dispatch(setCurrentDot(angleToIndex(ang)));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    const ang0 = clientPointToAngle(startClientX, startClientY);
    if (ang0 != null) dispatch(setCurrentDot(angleToIndex(ang0)));
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const startTouchDrag = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const move = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (!t) return;
      const ang = clientPointToAngle(t.clientX, t.clientY);
      if (ang != null) dispatch(setCurrentDot(angleToIndex(ang)));
    };
    const end = () => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
    const ang0 = clientPointToAngle(touch.clientX, touch.clientY);
    if (ang0 != null) dispatch(setCurrentDot(angleToIndex(ang0)));
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
  };

  return (
    <div className="flex h-full 1xz:gap-y-10 pt-5 1xz:pt-0 flex-col items-center justify-between">
      <p>When's your trip?</p>
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={startTouchDrag}
      >
        <CircularSliderBase isSmallScreen={isSmallScreen}>
          <FilledArc currentDot={currentDot} isSmallScreen={isSmallScreen} />
          <DotMarkers
            currentDot={currentDot}
            onSelect={handleDotClick}
            isSmallScreen={isSmallScreen}
          />
          <Knob
            currentDot={currentDot}
            isSmallScreen={isSmallScreen}
            onDragStart={(e) => startDrag(e.clientX, e.clientY)}
            onTouchStart={startTouchDrag}
          />
          <CenterDisplay currentDot={currentDot} />
        </CircularSliderBase>
      </div>
      <DateDisplay
        startDate={formattedStartDate}
        endDate={formattedEndDate}
        onEditClick={handleEditClick}
      />
    </div>
  );
};

const CircularSliderBase = ({ children, isSmallScreen }) => (
  <div
    className={`${
      isSmallScreen ? 'h-[16.12rem] w-[16.12rem]' : 'h-[18.12rem] w-[18.12rem]'
    } flex items-center justify-center bg-gradient-to-b from-[#f6f6f6] to-[#e9e9e9] rounded-[50%] shadow-sliderShadow relative`}
  >
    <div className="absolute inset-0 flex items-center justify-center">{children}</div>
  </div>
);

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, r, endAngle);
  const end = polarToCartesian(x, y, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const FilledArc = ({ currentDot, isSmallScreen }) => {
  const months = currentDot === 0 ? 12 : currentDot;
  const percent = months / 12;
  const endAngle = 360 * percent;
  const r = isSmallScreen ? 96 : 110; // ring radius (centerline)
  const c = isSmallScreen ? 129 : 145; // center
  // Base ring width and slightly thinner filled arc for a polished inset look
  const BASE_TRACK_WIDTH = isSmallScreen ? 56 : 64;
  const FILLED_TRACK_WIDTH = isSmallScreen ? 50 : 58;
  const circumference = 2 * Math.PI * r;
  const filledLenBase = circumference * percent;
  const epsilon = months % 3 === 0 && months !== 12 ? 0.9 : 0; // nudge to avoid flat caps at 0/3/6/9
  const filledLen = Math.min(circumference - 0.001, filledLenBase + epsilon);
  const capAllowance = Math.ceil((FILLED_TRACK_WIDTH + 8) / 2); // prevent mask from clipping round caps
  const ringOuterR = r + BASE_TRACK_WIDTH / 2 + capAllowance;
  const ringInnerR = r - BASE_TRACK_WIDTH / 2 - capAllowance;
  return (
    <svg
      className="absolute"
      width="290"
      height="290"
      viewBox="0 0 290 290"
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient
          id="arcGrad"
          gradientUnits="userSpaceOnUse"
          x1={c}
          y1={c - r}
          x2={c}
          y2={c + r}
        >
          <stop offset="0%" stopColor="#FF3A75" />
          <stop offset="35%" stopColor="#FF2B66" />
          <stop offset="70%" stopColor="#FF215D" />
          <stop offset="100%" stopColor="#E0063E" />
        </linearGradient>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feOffset dy="2" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* softer outer glow filter */}
        <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
          </feMerge>
        </filter>
        {/* clip the glow strictly to the ring band to prevent breaking outside */}
        <mask id="ringMask" maskUnits="userSpaceOnUse" x="0" y="0" width="290" height="290">
          <rect x="0" y="0" width="290" height="290" fill="black" />
          <circle cx={c} cy={c} r={ringOuterR} fill="white" />
          <circle cx={c} cy={c} r={ringInnerR} fill="black" />
        </mask>
      </defs>
      <circle cx={c} cy={c} r={r} stroke="#ececec" strokeWidth={BASE_TRACK_WIDTH} fill="none" />
      {/* soft outer glow under the arc, clipped to ring area to avoid overflow */}
      <g mask="url(#ringMask)">
        <circle
          cx={c}
          cy={c}
          r={r}
          stroke="url(#arcGrad)"
          strokeWidth={FILLED_TRACK_WIDTH + 8}
          fill="none"
          opacity={0.22}
          filter="url(#outerGlow)"
          strokeLinecap="round"
          strokeDasharray={`${filledLen} ${circumference - filledLen}`}
          strokeDashoffset={0.8}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </g>
      <circle
        cx={c}
        cy={c}
        r={r}
        stroke="url(#arcGrad)"
        strokeWidth={FILLED_TRACK_WIDTH}
        fill="none"
        filter="url(#softShadow)"
        strokeLinecap="round"
        strokeDasharray={`${filledLen} ${circumference - filledLen}`}
        strokeDashoffset={0.8}
        transform={`rotate(-90 ${c} ${c})`}
      />
    </svg>
  );
};

const DotMarkers = ({ currentDot, onSelect, isSmallScreen }) => {
  const radius = isSmallScreen ? 96 : 110;
  const center = isSmallScreen ? 129 : 145;
  const filledAngle = (currentDot === 0 ? 12 : currentDot) * (360 / TOTAL_DOTS);
  return (
    <div className="absolute inset-0">
      {[...Array(TOTAL_DOTS)].map((_, i) => {
        const angle = i * (360 / TOTAL_DOTS);
        const p = polarToCartesian(center, center, radius, angle);
        const covered = angle <= filledAngle; // hide dots under the red arc
        return (
          <button
            key={i}
            className="absolute rounded-full cursor-pointer"
            style={{
              left: p.x - 4,
              top: p.y - 4,
              width: 8,
              height: 8,
              background: '#222222',
              opacity: covered ? 0 : 0.35,
              display: covered ? 'none' : 'block',
            }}
            onClick={() => onSelect(i)}
            // enable click
            onMouseDown={(e) => e.stopPropagation()}
          />
        );
      })}
    </div>
  );
};

const Knob = ({ currentDot, isSmallScreen, onDragStart, onTouchStart }) => {
  const angle = (currentDot === 0 ? 12 : currentDot) * (360 / TOTAL_DOTS);
  const radius = isSmallScreen ? 96 : 110;
  const center = isSmallScreen ? 129 : 145;
  // If 0 (12 months) place slightly before top; if 1 month, place slightly after to avoid flat cap look
  const knobAngle = angle >= 360 ? 359.9 : angle <= 0 ? 0.1 : angle;
  const p = polarToCartesian(center, center, radius, knobAngle);
  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: isSmallScreen ? 258 : 290,
        height: isSmallScreen ? 258 : 290,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart?.(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onTouchStart?.(e);
      }}
    >
      <div
        className="rounded-full"
        style={{
          position: 'absolute',
          width: 42,
          height: 42,
          left: p.x - 21,
          top: p.y - 21,
          background: 'white',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        }}
      ></div>
    </div>
  );
};

const CenterDisplay = ({ currentDot }) => (
  <div className="1xz:h-[10.62rem] h-[8.62rem] flex items-center justify-center bg-white rounded-[50%] shadow-sliderShadow2 1xz:w-[10.62rem] w-[8.62rem]">
    <span className="flex flex-col items-center justify-center">
      <p className="1xz:text-[6rem] text-[5rem] 1xz:h-[7rem] h-[5.5rem] mb-2 font-bold p-0 m-0">
        {currentDot === 0 ? 12 : currentDot}
      </p>
      <p className="mb-6 font-bold text-lg">month{currentDot === 1 ? '' : 's'}</p>
    </span>
  </div>
);

const DateDisplay = ({ startDate, endDate, onEditClick }) => {
  const {
    dateFlexibility,
    startDateFlexibility,
    endDateFlexibility,
    selectedStartDate,
    selectedEndDate,
  } = useSelector((store: any) => store.form);

  // Format dates to "Mon, Sep 1" format with flexibility
  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString);
    const baseFormat = format(date, 'EEE, MMM d');
    const flexibilityText = dateFlexibility === 'exact' ? '' : ` ±${dateFlexibility}`;
    return baseFormat + flexibilityText;
  };

  const handleClick = () => {
    onEditClick();
  };

  // If we have both selected dates from calendar, show range with per-date flexibility
  if (selectedStartDate && selectedEndDate) {
    const startDateFormatted = format(selectedStartDate, 'EEE, MMM d');
    const endDateFormatted = format(selectedEndDate, 'EEE, MMM d');
    const startFlexibilityText =
      startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
    const endFlexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;

    return (
      <div className="mb-6">
        <p>
          <span
            onClick={() => onEditClick('startDate')}
            className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
          >
            {startDateFormatted}
            {startFlexibilityText}
          </span>
          <span className="mx-2 font-[350]">to</span>
          <span
            onClick={() => onEditClick('endDate')}
            className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
          >
            {endDateFormatted}
            {endFlexibilityText}
          </span>
        </p>
      </div>
    );
  }

  // If we have only start date from calendar, show it with flexibility
  if (selectedStartDate) {
    const selectedDateFormatted = format(selectedStartDate, 'EEE, MMM d');
    const flexibilityText = startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;

    return (
      <div className="mb-6">
        <p>
          <span
            onClick={() => onEditClick('startDate')}
            className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
          >
            {selectedDateFormatted}
            {flexibilityText}
          </span>
          <span className="mx-2 font-[350]">to</span>
          <span
            onClick={() => onEditClick('endDate')}
            className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
          >
            {formatCompactDate(endDate)}
          </span>
        </p>
      </div>
    );
  }

  // Fallback to original display if no selected date
  return (
    <div className="mb-6">
      <p>
        <span
          onClick={handleClick}
          className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
        >
          {formatCompactDate(startDate)}
        </span>
        <span className="mx-2 font-[350]">to</span>
        <span
          onClick={handleClick}
          className="font-medium cursor-pointer underline underline-offset-4 hover:text-blue-600"
        >
          {formatCompactDate(endDate)}
        </span>
      </p>
    </div>
  );
};

export default CircularSlider;
