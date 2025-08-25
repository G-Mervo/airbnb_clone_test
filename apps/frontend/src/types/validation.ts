import { z } from 'zod';

// Zod schemas for runtime validation
export const RoomSchema = z.object({
  id: z.string(),
  section: z.number(),
  'house-title': z.string(),
  title_1: z.string(),
  city: z.string(),
  country: z.string(),
  state: z.string().optional(),
  price: z.number().positive(),
  rating: z.number().min(0).max(5),
  house_rating: z.number().min(0).max(5),
  filter: z.string(),
  propertyType: z.string(),
  roomType: z.string(),
  is_new: z.boolean(),
  isGuestFavorite: z.boolean(),
  images: z.array(z.string().url()),
  description: z.string(),
  bedrooms: z.number().int().min(0),
  beds: z.number().int().min(0),
  bathrooms: z.number().min(0),
  max_guests: z.number().int().positive(),
  amenities: z.array(z.string()),
  host: z
    .object({
      name: z.string(),
      image: z.string().url(),
      joined: z.string(),
      response_rate: z.number().min(0).max(100),
      response_time: z.string(),
    })
    .optional(),
  reviews: z.array(z.any()).optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  instant_book: z.boolean().optional(),
  house_rules: z.array(z.string()).optional(),
  cancellation_policy: z.string().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  minimum_nights: z.number().int().positive().optional(),
  maximum_nights: z.number().int().positive().optional(),
  hidden: z.boolean().optional(),
});

export const BookingSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  user_id: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().positive(),
  total_price: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const FavoriteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  room_id: z.string(),
  created_at: z.string(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  payment_method: z.string(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  created_at: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  image: z.string().url().optional(),
  joined: z.string(),
  verified: z.boolean(),
});

// Validation functions
export const validateRoom = (data: unknown) => RoomSchema.parse(data);
export const validateRooms = (data: unknown) => z.array(RoomSchema).parse(data);
export const validateBooking = (data: unknown) => BookingSchema.parse(data);
export const validateBookings = (data: unknown) => z.array(BookingSchema).parse(data);
export const validateFavorite = (data: unknown) => FavoriteSchema.parse(data);
export const validateFavorites = (data: unknown) => z.array(FavoriteSchema).parse(data);
export const validatePayment = (data: unknown) => PaymentSchema.parse(data);
export const validatePayments = (data: unknown) => z.array(PaymentSchema).parse(data);
export const validateUser = (data: unknown) => UserSchema.parse(data);

// Safe validation functions (return null on error instead of throwing)
export const safeValidateRoom = (data: unknown) => {
  const result = RoomSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateRooms = (data: unknown) => {
  const result = z.array(RoomSchema).safeParse(data);
  return result.success ? result.data : null;
};
