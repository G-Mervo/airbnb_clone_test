import { api } from './apiClient';

/**
 * API service for handling bookings and trips
 */
export interface Booking {
  id: string | number;
  property_id: string | number;
  guest_id: string | number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

/**
 * Get all bookings for the current user
 */
export async function getUserBookings(status?: string): Promise<Booking[]> {
  try {
    const params: Record<string, any> = {};
    if (status) params.status = status;

    const bookings = await api.get('/api/bookings/my-bookings', params);
    return bookings;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
}

/**
 * Get a specific booking by ID
 */
export async function getBookingById(bookingId: string | number): Promise<Booking | null> {
  try {
    const booking = await api.get(`/api/bookings/${bookingId}`);
    return booking;
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    return null;
  }
}

/**
 * Create a new booking
 */
export async function createBooking(bookingData: Partial<Booking>): Promise<Booking | null> {
  try {
    const booking = await api.post('/api/bookings', bookingData);
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
}

/**
 * Update an existing booking
 */
export async function updateBooking(
  bookingId: string | number,
  updateData: Partial<Booking>,
): Promise<Booking | null> {
  try {
    const booking = await api.put(`/api/bookings/${bookingId}`, updateData);
    return booking;
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    return null;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string | number): Promise<boolean> {
  try {
    await api.put(`/api/bookings/${bookingId}/cancel`, {});
    return true;
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    return false;
  }
}
