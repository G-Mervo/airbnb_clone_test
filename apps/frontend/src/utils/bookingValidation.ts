import { differenceInDays, isAfter, isBefore, isToday, isFuture, parseISO } from "date-fns";

// Types for validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingValidationInput {
  startDate: Date | string | null;
  endDate: Date | string | null;
  adultCount: number;
  childCount: number;
  infantCount: number;
  petCount: number;
  propertyData: {
    maxGuests: number;
    minStay: number;
    maxStay: number;
    allowsPets: boolean;
    blockedDates: string[];
    availableDates: string[];
    maxAdvanceBooking: number; // days in advance
  };
}

// Utility to parse dates consistently
const parseDate = (date: Date | string | null): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  try {
    return parseISO(date);
  } catch {
    return null;
  }
};

// Validate date selection
export const validateDates = (
  startDate: Date | string | null,
  endDate: Date | string | null,
  propertyData: BookingValidationInput['propertyData']
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // Check if dates are provided
  if (!start) {
    errors.push("Please select a check-in date");
  }
  
  if (!end) {
    errors.push("Please select a check-out date");
  }

  // If both dates are missing, return early
  if (!start || !end) {
    return { isValid: false, errors, warnings };
  }

  // Check if start date is not in the past
  if (isBefore(start, new Date()) && !isToday(start)) {
    errors.push("Check-in date cannot be in the past");
  }

  // Check if end date is after start date
  if (!isAfter(end, start)) {
    errors.push("Check-out date must be after check-in date");
  }

  // Check minimum stay requirement
  const stayDuration = differenceInDays(end, start);
  if (stayDuration < propertyData.minStay) {
    if (propertyData.minStay === 1) {
      errors.push("Minimum stay is 1 night");
    } else {
      errors.push(`Minimum stay is ${propertyData.minStay} nights`);
    }
  }

  // Check maximum stay requirement
  if (stayDuration > propertyData.maxStay) {
    errors.push(`Maximum stay is ${propertyData.maxStay} nights`);
  }

  // Check advance booking limit
  const today = new Date();
  const daysInAdvance = differenceInDays(start, today);
  if (daysInAdvance > propertyData.maxAdvanceBooking) {
    errors.push(`Bookings can only be made up to ${propertyData.maxAdvanceBooking} days in advance`);
  }

  // Check for blocked dates
  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];
  
  for (const blockedDate of propertyData.blockedDates) {
    const blocked = parseDate(blockedDate);
    if (blocked && 
        ((isAfter(blocked, start) || blocked.toISOString().split('T')[0] === startDateStr) &&
         (isBefore(blocked, end) || blocked.toISOString().split('T')[0] === endDateStr))) {
      errors.push("Selected dates include unavailable periods");
      break;
    }
  }

  // Add warnings for peak seasons or special events
  if (stayDuration >= 14) {
    warnings.push("Long-term stays may require special approval from the host");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate guest count
export const validateGuests = (
  adultCount: number,
  childCount: number,
  infantCount: number,
  petCount: number,
  propertyData: BookingValidationInput['propertyData']
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum adults
  if (adultCount < 1) {
    errors.push("At least one adult is required");
  }

  // Check maximum guests (excluding infants)
  const totalGuests = adultCount + childCount;
  if (totalGuests > propertyData.maxGuests) {
    errors.push(`Maximum ${propertyData.maxGuests} guests allowed (excluding infants)`);
  }

  // Check pets policy
  if (petCount > 0 && !propertyData.allowsPets) {
    errors.push("Pets are not allowed at this property");
  }

  // Validate individual counts
  if (adultCount > 16) {
    errors.push("Maximum 16 adults allowed");
  }

  if (childCount > 5) {
    errors.push("Maximum 5 children allowed");
  }

  if (infantCount > 5) {
    errors.push("Maximum 5 infants allowed");
  }

  if (petCount > 5) {
    errors.push("Maximum 5 pets allowed");
  }

  // Add warnings
  if (totalGuests === propertyData.maxGuests) {
    warnings.push("You've reached the maximum guest capacity");
  }

  if (infantCount > 0 && totalGuests === propertyData.maxGuests) {
    warnings.push("Please confirm there are adequate sleeping arrangements for infants");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Complete booking validation
export const validateBooking = (input: BookingValidationInput): ValidationResult => {
  const dateValidation = validateDates(
    input.startDate,
    input.endDate,
    input.propertyData
  );

  const guestValidation = validateGuests(
    input.adultCount,
    input.childCount,
    input.infantCount,
    input.petCount,
    input.propertyData
  );

  // Combine results
  const allErrors = [...dateValidation.errors, ...guestValidation.errors];
  const allWarnings = [...dateValidation.warnings, ...guestValidation.warnings];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

// Check if dates are available (for real-time validation)
export const checkDateAvailability = async (
  startDate: Date | string,
  endDate: Date | string,
  propertyId: string
): Promise<{ available: boolean; message?: string }> => {
  // Mock availability check - replace with actual API call
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock logic: randomly make some dates unavailable
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (!start || !end) {
      return { available: false, message: "Invalid dates" };
    }

    // Mock blocked dates (weekends in the next month for demo)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (start.getMonth() === nextMonth.getMonth() && 
        (start.getDay() === 0 || start.getDay() === 6)) {
      return { 
        available: false, 
        message: "Selected dates are not available" 
      };
    }

    return { available: true };
  } catch (error) {
    return { 
      available: false, 
      message: "Unable to check availability. Please try again." 
    };
  }
};

// Get property booking constraints from property data
export const getBookingConstraints = (propertyData: any) => {
  return {
    maxGuests: propertyData?.max_guests || propertyData?.capacity?.guests || 4,
    minStay: propertyData?.min_stay || 1,
    maxStay: propertyData?.max_stay || 30,
    allowsPets: propertyData?.allows_pets || propertyData?.bookingOptions?.allowsPets || false,
    blockedDates: propertyData?.blocked_dates || [],
    availableDates: propertyData?.available_dates || [],
    maxAdvanceBooking: propertyData?.max_advance_booking || 365
  };
};

// Format validation errors for display
export const formatValidationMessage = (validation: ValidationResult): string => {
  if (validation.isValid) {
    return validation.warnings.length > 0 
      ? validation.warnings.join('. ') 
      : "Booking details look good!";
  }
  
  return validation.errors.join('. ');
};

// Check if booking can proceed (for button state)
export const canProceedWithBooking = (validation: ValidationResult): boolean => {
  return validation.isValid;
};