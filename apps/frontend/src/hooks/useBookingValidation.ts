import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { 
  validateBooking, 
  checkDateAvailability, 
  getBookingConstraints,
  ValidationResult,
  BookingValidationInput 
} from "../utils/bookingValidation";

interface UseBookingValidationProps {
  propertyData: any;
  propertyId: string;
}

interface UseBookingValidationReturn {
  validation: ValidationResult;
  isValidating: boolean;
  canProceed: boolean;
  validationMessage: string;
  checkAvailability: () => Promise<void>;
  isCheckingAvailability: boolean;
  availabilityResult: { available: boolean; message?: string } | null;
}

export const useBookingValidation = ({ 
  propertyData, 
  propertyId 
}: UseBookingValidationProps): UseBookingValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message?: string } | null>(null);

  // Get form data from Redux
  const {
    selectedStartDate: startDate,
    selectedEndDate: endDate,
    adultCount,
    childCount,
    infantCount,
    petsCount: petCount,
  } = useSelector((store: any) => store.form);

  // Get property constraints
  const propertyConstraints = useMemo(() => {
    return getBookingConstraints(propertyData);
  }, [propertyData]);

  // Create validation input
  const validationInput: BookingValidationInput = useMemo(() => ({
    startDate,
    endDate,
    adultCount,
    childCount,
    infantCount,
    petCount,
    propertyData: propertyConstraints,
  }), [
    startDate,
    endDate,
    adultCount,
    childCount,
    infantCount,
    petCount,
    propertyConstraints,
  ]);

  // Run validation
  const validation = useMemo(() => {
    setIsValidating(true);
    const result = validateBooking(validationInput);
    setIsValidating(false);
    return result;
  }, [validationInput]);

  // Check availability function
  const checkAvailability = async () => {
    if (!startDate || !endDate) return;
    
    setIsCheckingAvailability(true);
    try {
      const result = await checkDateAvailability(startDate, endDate, propertyId);
      setAvailabilityResult(result);
    } catch (error) {
      setAvailabilityResult({
        available: false,
        message: "Unable to check availability"
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Auto-check availability when dates change
  useEffect(() => {
    if (startDate && endDate && validation.isValid) {
      const timeoutId = setTimeout(() => {
        checkAvailability();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    } else {
      setAvailabilityResult(null);
    }
  }, [startDate, endDate, validation.isValid]);

  // Determine if booking can proceed
  const canProceed = useMemo(() => {
    return validation.isValid && 
           (availabilityResult?.available !== false) &&
           startDate && 
           endDate;
  }, [validation.isValid, availabilityResult, startDate, endDate]);

  // Create validation message
  const validationMessage = useMemo(() => {
    // If there are validation errors, show them first
    if (!validation.isValid) {
      return validation.errors.join('. ');
    }

    // If dates are not selected, show guidance
    if (!startDate || !endDate) {
      return "Select dates to see availability";
    }

    // If checking availability, show loading state
    if (isCheckingAvailability) {
      return "Checking availability...";
    }

    // If availability check failed, show that message
    if (availabilityResult && !availabilityResult.available) {
      return availabilityResult.message || "Selected dates are not available";
    }

    // If there are warnings, show them
    if (validation.warnings.length > 0) {
      return validation.warnings.join('. ');
    }

    // If everything is good
    if (availabilityResult?.available) {
      return "Dates are available!";
    }

    return "Ready to check availability";
  }, [
    validation,
    startDate,
    endDate,
    isCheckingAvailability,
    availabilityResult,
  ]);

  return {
    validation,
    isValidating,
    canProceed,
    validationMessage,
    checkAvailability,
    isCheckingAvailability,
    availabilityResult,
  };
};

// Hook for real-time date validation (for calendar component)
export const useDateValidation = (propertyData: any) => {
  const propertyConstraints = useMemo(() => {
    return getBookingConstraints(propertyData);
  }, [propertyData]);

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return propertyConstraints.blockedDates.includes(dateStr);
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateTooFarInFuture = (date: Date): boolean => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + propertyConstraints.maxAdvanceBooking);
    return date > maxDate;
  };

  const isDateAvailable = (date: Date): boolean => {
    return !isDateBlocked(date) && 
           !isDateInPast(date) && 
           !isDateTooFarInFuture(date);
  };

  const getDateStatus = (date: Date): 'available' | 'blocked' | 'past' | 'too-far' => {
    if (isDateInPast(date)) return 'past';
    if (isDateTooFarInFuture(date)) return 'too-far';
    if (isDateBlocked(date)) return 'blocked';
    return 'available';
  };

  return {
    isDateBlocked,
    isDateInPast,
    isDateTooFarInFuture,
    isDateAvailable,
    getDateStatus,
    propertyConstraints,
  };
};