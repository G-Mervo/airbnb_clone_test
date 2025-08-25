import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import arrowUp from '../../asset/Icons_svg/arrowUpword.svg';
import {
  setAdultCount,
  setChildCount,
  setInfantCount,
  setPetsCount,
} from '../../redux/mainFormSlice';
import { setShowLogin } from '../../redux/AppSlice';
import { setIsVisible } from '../../redux/HouseDetailSlice';
import { useDispatch, useSelector } from 'react-redux';
import { differenceInDays, format } from 'date-fns';
import UnifiedCalendarModal from './UnifiedCalendarModal';

interface GuestInfoProps {
  scrollToSection: (sectionId: string) => (event: React.MouseEvent) => void;
  guestDetails: string;
}

interface DateSelectionProps {
  scrollToSection: (sectionId: string) => (event: React.MouseEvent) => void;
  formatStartDate: string | null;
  formatEndDate: string | null;
}

interface PricingDetailsProps {
  price: number;
  numOfDays: number;
}

// Custom components
const LoadingPlaceholder: React.FC = () => (
  <div>
    <div className="w-40 mt-8 ml-20 h-10 bg-gray-200 animate-pulse"></div>
    <div className="w-80 mt-4 ml-20 h-10 bg-gray-200 animate-pulse"></div>
  </div>
);

const DateSelection: React.FC<DateSelectionProps> = ({
  scrollToSection,
  formatStartDate,
  formatEndDate,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  const {
    guestPlural,
    petPlural,
    adultCount,
    childCount,
    infantCount,
    petsCount: petCount,
    selectedStartDate: startDate,
    selectedEndDate: endDate,
  } = useSelector((store: any) => store.form);

  const [activeInput, setActiveInput] = useState<'checkIn' | 'checkOut'>('checkIn');

  const handleDateClick = () => {
    if (!isCalendarOpen) setIsCalendarOpen(true);
  };

  const closeCalendar = () => setIsCalendarOpen(false);

  return (
    <div className="border my-4 border-border-color rounded-lg h-28 relative z-[10002]">
      <div className="w-full h-1/2 flex border-b border-border-color relative">
        {/* Original buttons - always visible and untouched. We only open the modal around them. */}
        <div
          ref={dateContainerRef}
          className="w-full h-full flex cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors relative z-[10002]"
        >
          <div
            className={`w-1/2 h-full flex justify-center flex-col px-3 relative z-[10004] ${
              isCalendarOpen
                ? activeInput === 'checkIn'
                  ? 'border-2 border-black rounded-l-lg border-r-2'
                  : 'border-2 border-gray-300 rounded-l-lg border-r-0'
                : 'border-r-[1px] border-border-color'
            }`}
            onClick={() => {
              if (!isCalendarOpen) handleDateClick();
              setActiveInput('checkIn');
            }}
          >
            <span className="text-[10px] whitespace-nowrap font-semibold">CHECK-IN</span>
            <span className="text-sm whitespace-nowrap text-grey font-normal">
              {startDate ? formatStartDate : 'Add date'}
            </span>
          </div>
          <div
            className={`w-1/2 h-full flex justify-center flex-col px-3 relative z-[10004] ${
              isCalendarOpen
                ? activeInput === 'checkOut'
                  ? 'border-2 border-black rounded-r-lg border-l-2 border-l-black'
                  : 'border-2 border-gray-300 rounded-r-lg border-l-2 border-l-gray-300'
                : ''
            }`}
            onClick={() => {
              if (!isCalendarOpen) handleDateClick();
              setActiveInput('checkOut');
            }}
          >
            <span className="text-[10px] font-semibold">CHECKOUT</span>
            <span className="text-sm text-grey whitespace-nowrap font-normal">
              {endDate ? formatEndDate : 'Add date'}
            </span>
          </div>
        </div>

        {/* Calendar modal positioned to appear unified with buttons */}
        <UnifiedCalendarModal
          isOpen={isCalendarOpen}
          onClose={closeCalendar}
          containerRef={dateContainerRef}
          activeInput={activeInput}
          setActiveInput={setActiveInput}
        />
      </div>
      <GuestInfo
        scrollToSection={scrollToSection}
        guestDetails={
          adultCount + childCount > 0
            ? `${adultCount + childCount} guest${guestPlural} ${
                infantCount
                  ? `${infantCount} infant${infantCount > 1 ? 's' : ''}${petCount ? ',' : ''}`
                  : ''
              } ${petCount ? `${petCount} pet${petPlural}` : ''}`
            : 'Add guest'
        }
      />
    </div>
  );
};

const GuestInfo: React.FC<GuestInfoProps> = ({ scrollToSection, guestDetails }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { adultCount, childCount, infantCount, petsCount } = useSelector((s: any) => s.form);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div
      className="flex h-1/2 items-center px-3 w-full justify-between hover:bg-gray-50 cursor-pointer transition-colors"
      ref={wrapperRef}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex flex-col pointer-events-none">
        <span className="text-[10px] font-semibold">GUESTS</span>
        <span className="text-sm font-light">{guestDetails}</span>
      </div>
      <img className="h-4 w-4 pointer-events-none" src={arrowUp} alt="arrow up" />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[10005]">
          <div className="bg-white rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.28)] border border-gray-200 px-6 py-6">
            {/* Guest counter content with proper spacing */}
            <div className="space-y-6">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Adults</div>
                  <div className="text-sm text-gray-600">Age 13+</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (adultCount > 1) dispatch(setAdultCount(adultCount - 1));
                    }}
                  >
                    -
                  </button>
                  <span className="min-w-[20px] text-center">{adultCount}</span>
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (adultCount + childCount < 16) dispatch(setAdultCount(adultCount + 1));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Children</div>
                  <div className="text-sm text-gray-600">Ages 2–12</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (childCount > 0) dispatch(setChildCount(childCount - 1));
                    }}
                  >
                    -
                  </button>
                  <span className="min-w-[20px] text-center">{childCount}</span>
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (adultCount + childCount < 16) {
                        if (adultCount === 0) dispatch(setAdultCount(1));
                        dispatch(setChildCount(childCount + 1));
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Infants</div>
                  <div className="text-sm text-gray-600">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (infantCount > 0) dispatch(setInfantCount(infantCount - 1));
                    }}
                  >
                    -
                  </button>
                  <span className="min-w-[20px] text-center">{infantCount}</span>
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (infantCount < 5) {
                        if (adultCount + childCount === 0) dispatch(setAdultCount(1));
                        dispatch(setInfantCount(infantCount + 1));
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pets */}
              <div className="flex items-center justify-between pb-4">
                <div>
                  <div className="font-medium">Pets</div>
                  <div className="text-sm text-gray-600 underline cursor-pointer hover:text-black">
                    Bringing a service animal?
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (petsCount > 0) dispatch(setPetsCount(petsCount - 1));
                    }}
                  >
                    -
                  </button>
                  <span className="min-w-[20px] text-center">{petsCount}</span>
                  <button
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (petsCount < 5) {
                        if (adultCount + childCount === 0) dispatch(setAdultCount(1));
                        dispatch(setPetsCount(petsCount + 1));
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Property specific note */}
            <div className="text-sm text-gray-600 mb-4 pt-4 border-t border-gray-200">
              This place has a maximum of 2 guests, not including infants. If you're bringing more
              than 2 pets, please let your host know.
            </div>

            {/* Close button */}
            <div className="flex justify-end">
              <button
                className="underline text-sm font-medium hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PricingDetails: React.FC<PricingDetailsProps> = ({ price, numOfDays }) => {
  const serviceFee = Math.ceil(price * Math.abs(numOfDays)) * 0.1;

  return (
    <div className="w-full mt-6">
      <div className="flex justify-between">
        <span className="font-light">{`$${price} x ${Math.abs(numOfDays)}`}</span>
        <span className="font-light">${Math.ceil(price * Math.abs(numOfDays))}</span>
      </div>
      <div className="flex py-4 border-b border-grey-dim justify-between">
        <span className="font-light">Service fee</span>
        <span className="font-light">${Math.ceil(serviceFee)}</span>
      </div>
      <div className="flex justify-between border-grey-dim pt-6">
        <span className="font-medium">Total before taxes</span>
        <span className="font-medium">
          ${Math.ceil(Math.ceil(price * Math.abs(numOfDays)) + serviceFee)}
        </span>
      </div>
    </div>
  );
};

const scrollToSection = (sectionId: string) => (event: React.MouseEvent) => {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const BookingForm: React.FC = () => {
  const [formatStartDate, setFormatStartDate] = useState<string | null>(null);
  const [formatEndDate, setFormatEndDate] = useState<string | null>(null);
  const isLoading = useSelector((store: any) => store.houseDetail.isLoading);
  const allHouseInfo = useSelector((store: any) => store.houseDetail.houseInfo);
  const location = useLocation();
  const houseId = location.pathname.split('/house/')[1] || '';
  const houseInfo = allHouseInfo[houseId];
  const { userData } = useSelector((store: any) => store.app);
  const onHouseDetailPage = location.pathname.includes('/house');
  const dispatch = useDispatch();

  const elementRef = useRef<HTMLButtonElement>(null);
  const { selectedStartDate: startDate, selectedEndDate: endDate } = useSelector(
    (store: any) => store.form,
  );
  const numOfDays = differenceInDays(
    endDate ? new Date(endDate) : new Date(),
    startDate ? new Date(startDate) : new Date(),
  );

  useEffect(() => {
    if (startDate) {
      setFormatStartDate(format(new Date(startDate), 'MM/dd/yyyy'));
    }
    if (endDate) {
      setFormatEndDate(format(new Date(endDate), 'MM/dd/yyyy'));
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        dispatch(setIsVisible(entry.isIntersecting));
      },
      {
        root: null,
        rootMargin: '-90px',
        threshold: 0,
      },
    );

    const handleScroll = () => {
      if (elementRef?.current) {
        observer.observe(elementRef?.current);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Initial call to handleScroll to start observing
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (elementRef?.current) {
        observer.unobserve(elementRef?.current);
      }
    };
  }, [dispatch]);

  return (
    <div className="max-w-[26.32rem] 1smd:ml-20 ml-10 w-full">
      {isLoading ? (
        <LoadingPlaceholder />
      ) : (
        <div
          className={`pt-8 mb-20 ${
            onHouseDetailPage ? 'hidden 1xz:flex' : 'flex'
          } justify-end sticky top-20`}
        >
          {!startDate || !endDate ? (
            <div className="rounded-xl border-[1px] w-full border-grey-dim p-6 max-w-[23.14rem]">
              <h1 className="text-2xl font-light mb-6">Add dates for prices</h1>
              <DateSelection
                scrollToSection={scrollToSection}
                formatStartDate={formatStartDate}
                formatEndDate={formatEndDate}
              />

              <button
                disabled
                className="w-full h-12 rounded-full flex-center text-white bg-gradient-to-r from-[#EB194B] via-[#E01463] to-[#CF0E7C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
              >
                <span className="text-white text-nowrap">Check availability</span>
              </button>
            </div>
          ) : (
            <div className="max-w-[23.14rem] min-w-64 w-full shadow-priceCardShadow border-[1px] p-6 rounded-xl border-grey-dim">
              <span className="text-2xl font-light">
                ${houseInfo?.base_price} <span className="text-base">night</span>
              </span>
              <DateSelection
                scrollToSection={scrollToSection}
                formatStartDate={formatStartDate}
                formatEndDate={formatEndDate}
              />

              <Link
                to={userData ? `/${houseInfo.id}/book` : '#'}
                onClick={(e) => !userData && dispatch(setShowLogin(true))}
              >
                <button
                  ref={elementRef}
                  className="w-full h-12 rounded-full flex-center text-white bg-gradient-to-r from-[#EB194B] via-[#E01463] to-[#CF0E7C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                >
                  <span className="text-white">Reserve</span>
                </button>
              </Link>
              <div className="w-full flex-center mt-2">
                <span className="text-sm pt-2 font-light">You won't be charged yet</span>
              </div>
              <PricingDetails price={houseInfo?.base_price} numOfDays={numOfDays} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingForm;
