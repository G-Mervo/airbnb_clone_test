import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { differenceInDays, format, isSameMonth } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

import Footer from '../Footer/Footer';
import CalendarModal from '../Header/Form/CalendarModal';
import Calendar from '../Header/Form/FormFields/Calendar';
import AddGuestModal from '../Modals/AddGuestModal';

import { setAdultCount, setCalendarModalOpen } from '../../redux/mainFormSlice';
import { setBookingDate } from '../../redux/AppSlice';
import * as apiBookings from '../../api/apiBookings';
import roomsService from '../../api/apiRooms';

// Type definitions
interface PriceCalculation {
  basePrice: number;
  serviceFee: number;
  taxes: number;
  total: number;
}

interface RoomCardProps {
  roomData: any;
  rating?: string[];
}

interface PriceDetailsProps {
  roomData: any;
  numOfDays: number;
  totalAmount: number;
}

interface TripSummaryProps {
  bookingDate: string;
  guestCount: string;
  onEditDatesClick: () => void;
  onEditGuestsClick: () => void;
}

// Utility function to calculate total booking amount
const calculateTotalAmount = (price: number, numOfDays: number): number => {
  const days = Math.abs(numOfDays) || 0;
  const basePrice = Math.ceil(price);
  const stayCost = Math.ceil(basePrice * days);
  const serviceFee = Math.floor(basePrice * 0.14); // 14% service fee
  const taxes = Math.floor(0.11 * stayCost); // 11% taxes

  return stayCost + serviceFee + taxes;
};

// Calculate price breakdown
const calculatePriceBreakdown = (price: number, numOfDays: number): PriceCalculation => {
  const days = Math.abs(numOfDays) || 0;
  const basePrice = Math.ceil(price);
  const stayCost = Math.ceil(basePrice * days);
  const serviceFee = Math.floor(basePrice * 0.14);
  const taxes = Math.floor(0.11 * stayCost);

  return {
    basePrice: stayCost,
    serviceFee,
    taxes,
    total: stayCost + serviceFee + taxes,
  };
};

// Custom hook for booking dates
const useBookingDates = () => {
  const startDate = useSelector((store: any) => store.form.selectedStartDate);
  const endDate = useSelector((store: any) => store.form.selectedEndDate);
  const dispatch = useDispatch();

  const [formattedDates, setFormattedDates] = useState({
    formatStartDate: null as string | null,
    formattedEndDate: null as string | null,
    numOfDays: 0,
  });

  const updateDates = useCallback(() => {
    if (startDate && endDate) {
      const days = differenceInDays(new Date(endDate), new Date(startDate));
      const formattedStart = format(new Date(startDate), 'EEE MMM dd, yyyy');
      const formattedEnd = format(new Date(endDate), 'EEE MMM dd, yyyy');

      setFormattedDates({
        formatStartDate: formattedStart,
        formattedEndDate: formattedEnd,
        numOfDays: days,
      });
    }
  }, [startDate, endDate]);

  const handleCloseModal = useCallback(() => {
    dispatch(setCalendarModalOpen(false));
    updateDates();
  }, [updateDates, dispatch]);

  useEffect(() => {
    updateDates();
  }, [updateDates]);

  return {
    ...formattedDates,
    handleCloseModal,
    startDate,
    endDate,
  };
};

// Custom hook for guest count
const useGuestCount = () => {
  const {
    adultCount,
    childCount,
    infantCount,
    petsCount: petCount,
    guestPlural,
    petPlural,
  } = useSelector((store: any) => store.form);

  const { cancelGuestUpdate } = useSelector((store: any) => store.app);
  const dispatch = useDispatch();
  const [guestCount, setGuestCount] = useState('');

  useLayoutEffect(() => {
    const totalGuests = adultCount + childCount;
    let formattedCount = `${totalGuests} guest${guestPlural}${
      infantCount + petCount > 0 ? ',' : ''
    }`;

    if (infantCount) {
      formattedCount += ` ${infantCount} infant${infantCount > 1 ? 's' : ''}`;
    }

    if (petCount) {
      formattedCount += `${infantCount ? ',' : ''} ${petCount} pet${petPlural}`;
    }

    if (formattedCount !== '0 guests,') {
      if (!cancelGuestUpdate) {
        setGuestCount(formattedCount);
      }
    } else {
      setGuestCount('1 guest');
    }

    if (guestCount === '0 guest') {
      dispatch(setAdultCount(1));
    }
  }, [
    adultCount,
    childCount,
    infantCount,
    petCount,
    guestPlural,
    petPlural,
    cancelGuestUpdate,
    dispatch,
    guestCount,
  ]);

  return guestCount;
};

// Room card component
const RoomCard: React.FC<RoomCardProps> = ({ roomData, rating }) => (
  <div className="flex items-center gap-4">
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
      <img
        src={roomData?.thumbnail || roomData?.images?.[0]}
        alt={roomData?.title}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1">
      <div className="text-sm text-gray-600 mb-1">{roomData?.propertyType || 'Entire home'}</div>
      <div className="font-medium text-gray-900 line-clamp-2">
        {roomData?.title || 'Beautiful property'}
      </div>
      {rating && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm">⭐</span>
          <span className="text-sm font-medium">{rating[0]}</span>
          <span className="text-sm text-gray-500">({rating[0]} reviews)</span>
        </div>
      )}
    </div>
  </div>
);

// Price details component
const PriceDetails: React.FC<PriceDetailsProps> = ({ roomData, numOfDays }) => {
  const priceBreakdown = calculatePriceBreakdown(roomData?.base_price || 0, numOfDays);

  return (
    <div className="space-y-4 pt-6">
      <h3 className="font-medium text-lg">Price details</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>
            ${roomData?.base_price} × {Math.abs(numOfDays)} nights
          </span>
          <span>${priceBreakdown.basePrice}</span>
        </div>

        <div className="flex justify-between">
          <span>Service fee</span>
          <span>${priceBreakdown.serviceFee}</span>
        </div>

        <div className="flex justify-between">
          <span>Taxes</span>
          <span>${priceBreakdown.taxes}</span>
        </div>

        <div className="border-t pt-3 flex justify-between font-medium">
          <span>Total (USD)</span>
          <span>${priceBreakdown.total}</span>
        </div>
      </div>
    </div>
  );
};

// Trip summary component
const TripSummary: React.FC<TripSummaryProps> = ({
  bookingDate,
  guestCount,
  onEditDatesClick,
  onEditGuestsClick,
}) => (
  <div className="border border-gray-200 rounded-lg p-6 mb-6">
    <h2 className="text-xl font-medium mb-6">Your trip</h2>

    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">Dates</div>
          <div className="text-gray-600">{bookingDate || 'Select dates'}</div>
        </div>
        <button
          onClick={onEditDatesClick}
          className="text-sm font-medium underline hover:no-underline"
        >
          Edit
        </button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">Guests</div>
          <div className="text-gray-600">{guestCount}</div>
        </div>
        <button
          onClick={onEditGuestsClick}
          className="text-sm font-medium underline hover:no-underline"
        >
          Edit
        </button>
      </div>
    </div>
  </div>
);

// Payment section placeholder
const PaymentSection: React.FC = () => (
  <div className="border border-gray-200 rounded-lg p-6 mb-6">
    <h2 className="text-xl font-medium mb-6">Pay with</h2>

    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-medium">
            💳
          </div>
          <div>
            <div className="font-medium">Credit or debit card</div>
            <div className="text-sm text-gray-600">
              Visa, Mastercard, American Express, and more
            </div>
          </div>
        </div>
      </div>

      {/* Mock payment form */}
      <div className="space-y-4 pt-4">
        <div>
          <label className="block text-sm font-medium mb-2">Card number</label>
          <input
            type="text"
            placeholder="1234 1234 1234 1234"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            disabled
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Expiration</label>
            <input
              type="text"
              placeholder="MM / YY"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">CVV</label>
            <input
              type="text"
              placeholder="123"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cardholder name</label>
          <input
            type="text"
            placeholder="Full name on card"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            disabled
          />
        </div>
      </div>
    </div>
  </div>
);

// Main checkout page component
const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [openGuestModal, setOpenGuestModal] = useState(false);

  const { userData } = useSelector((store: any) => store.app);
  const {
    isCalendarModalOpen: isModalOpen,
    selectedStartDate,
    selectedEndDate,
    adultCount,
    childCount,
    infantCount,
    petsCount,
  } = useSelector((store: any) => store.form);
  const bookingDate = useSelector((store: any) => store.app.bookingDate);

  // Just get room data directly from API - screw the Redux complexity!
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const room = await roomsService.getRoomById(String(id));
        console.log('✅ FOUND ROOM:', room);
        setRoomData(room);
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    if (id) {
      fetchRoomData();
    }
  }, [id]);

  // Custom hooks
  const { formatStartDate, formattedEndDate, numOfDays, handleCloseModal } = useBookingDates();
  const guestCount = useGuestCount();

  // Calculate total amount
  const totalAmount = roomData ? calculateTotalAmount(roomData.base_price, numOfDays) : 0;

  // Handle date range formatting for display
  useEffect(() => {
    const formatDateRange = (start: string | null, end: string | null): string => {
      if (!start || !end) return '';

      const startD = new Date(start);
      const endD = new Date(end);

      if (isSameMonth(startD, endD)) {
        return `${format(startD, 'dd')} - ${format(endD, 'dd MMM')}`;
      } else {
        return `${format(startD, 'dd MMM')} - ${format(endD, 'dd MMM')}`;
      }
    };

    const formattedDateRange = formatDateRange(formatStartDate, formattedEndDate);
    dispatch(setBookingDate(formattedDateRange));
  }, [formatStartDate, formattedEndDate, dispatch]);

  // Redirect if not logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userData) {
        navigate('/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [userData, navigate]);

  // Prevent scroll restoration
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Handle edit clicks
  const handleEditDatesClick = () => {
    dispatch(setCalendarModalOpen(true));
  };

  const handleEditGuestsClick = () => {
    setOpenGuestModal(true);
  };

  // Handle booking submission
  const handleRequestToBook = async () => {
    if (!roomData || !userData || !id) {
      console.error('Missing data for booking:', { roomData, userData, id });
      alert('Missing room data. Please try again.');
      return;
    }

    if (!selectedStartDate || !selectedEndDate) {
      alert('Please select check-in and check-out dates.');
      return;
    }

    // Create booking object
    console.log('🚀 Creating booking with roomData:', roomData);
    console.log('🚀 roomData.images:', roomData.images);
    console.log('🚀 First image:', roomData.images?.[0]);

    const newBooking = {
      roomId: id,
      userId: userData.uid || userData.id,
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      guestCount: {
        adults: adultCount || 1,
        children: childCount || 0,
        infants: infantCount || 0,
        pets: petsCount || 0,
      },
      totalAmount,
      roomData: {
        title: roomData.title || roomData.title_2 || roomData['house-title'] || 'Property',
        location: `${roomData.city || 'Unknown City'}, ${
          roomData.country || roomData.state || 'Unknown Location'
        }`,
        image: roomData.images?.[0] || roomData.house_main_photo || roomData.image || '',
        price: roomData.base_price || 0,
      },
      bookingDate: new Date().toISOString(),
      status: 'pending' as const, // Default to pending until confirmed by backend
    };

    console.log('Final booking object:', newBooking);
    console.log('Final image saved:', newBooking.roomData.image);

    try {
      // Call backend API to create booking
      const createdBooking = await apiBookings.createBooking(newBooking);

      if (createdBooking) {
        // Show success message and navigate
        alert('Booking confirmed! You can view your trips in your profile.');
        navigate('/trips');
      } else {
        alert('Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Please log in to continue</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to make a booking.</p>
          <Link
            to="/login"
            className="bg-pink hover:bg-dark-pink text-white px-6 py-2 rounded-lg inline-block"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-medium">Request to book</h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left column - Forms */}
          <div className="space-y-6">
            <TripSummary
              bookingDate={bookingDate}
              guestCount={guestCount}
              onEditDatesClick={handleEditDatesClick}
              onEditGuestsClick={handleEditGuestsClick}
            />

            <PaymentSection />

            {/* Ground rules */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Ground rules</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  We ask every guest to remember a few simple things about what makes a great guest.
                </p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>Follow the house rules</li>
                  <li>Treat your Host's home like your own</li>
                </ul>
              </div>
            </div>

            {/* Booking button */}
            <div className="pt-6">
              <button
                onClick={handleRequestToBook}
                className="w-full bg-pink hover:bg-dark-pink text-white font-medium py-4 rounded-lg transition-colors"
              >
                Request to book
              </button>
            </div>
          </div>

          {/* Right column - Booking summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="border border-gray-200 rounded-lg p-6">
              <RoomCard roomData={roomData} />
              <PriceDetails roomData={roomData} numOfDays={numOfDays} totalAmount={totalAmount} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalendarModal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="w-full overflow-x-hidden lg:w-[41.31rem]">
          <Calendar />
        </div>
      </CalendarModal>

      <AddGuestModal isOpen={openGuestModal} onClose={() => setOpenGuestModal(false)} />

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default CheckoutPage;
