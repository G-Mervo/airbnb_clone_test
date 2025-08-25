// @ts-nocheck
import { createMockClient } from './mockSupabase';
import rooms from './rooms.json';
import favorites from './favorites.json';
import bookings from './bookings.json';
import payments from './payments.json';

// Create and initialize the mock Supabase client with our data
const mockSupabase = createMockClient()
  .initMockData('Rooms', rooms)
  .initMockData('Favorites', favorites)
  .initMockData('Bookings', bookings)
  .initMockData('Payments', payments);

export default mockSupabase;
