import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { getUserBookings } from '../api/apiBookings';

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startDate: string;
  endDate: string;
  guestCount: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  totalAmount: number;
  roomData: {
    title: string;
    location: string;
    image: string;
    price: number;
  };
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface BookingsState {
  bookings: Booking[];
}

// Map API Booking to local Booking type
const mapApiBooking = (apiBooking: any): Booking => ({
  id: apiBooking.id,
  roomId: apiBooking.roomId,
  userId: apiBooking.userId,
  startDate: apiBooking.startDate,
  endDate: apiBooking.endDate,
  guestCount: apiBooking.guestCount,
  totalAmount: apiBooking.totalAmount,
  roomData: apiBooking.roomData,
  bookingDate: apiBooking.bookingDate,
  status: apiBooking.status,
});

// Async thunk to fetch bookings from API
export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async () => {
    const apiBookings = await getUserBookings();
    return apiBookings.map(mapApiBooking);
  }
);

const initialState: BookingsState = {
  bookings: [],
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.push(action.payload);
    },
    removeBooking: (state, action: PayloadAction<string>) => {
      state.bookings = state.bookings.filter((booking) => booking.id !== action.payload);
    },
    updateBookingStatus: (
      state,
      action: PayloadAction<{ id: string; status: 'confirmed' | 'pending' | 'cancelled' }>,
    ) => {
      const bookingIndex = state.bookings.findIndex((booking) => booking.id === action.payload.id);
      if (bookingIndex !== -1) {
        state.bookings[bookingIndex].status = action.payload.status;
      }
    },
    clearAllBookings: (state) => {
      state.bookings = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserBookings.fulfilled, (state, action) => {
      state.bookings = action.payload;
    });
  },
});

export const { loadBookings, addBooking, removeBooking, updateBookingStatus, clearAllBookings } =
  bookingsSlice.actions;
export default bookingsSlice.reducer;
