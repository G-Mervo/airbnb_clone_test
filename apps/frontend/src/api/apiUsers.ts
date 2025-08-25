/**
 * API service for user profiles and accounts
 */
import { api } from './apiClient';

// Types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_image?: string;
  phone_number?: string;
  is_host: boolean;
  created_at: string;
  updated_at: string;
  location?: string;
  languages?: string[];
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  verified_email: boolean;
  verified_id: boolean;
  verified_phone: boolean;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_image?: string | File;
  phone_number?: string;
  location?: string;
  languages?: string[];
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_account';
  name: string;
  last_four: string;
  expiry_date?: string;
  is_default: boolean;
}

/**
 * User Profile API service
 */
const userService = {
  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      return await api.get('/users/me');
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  /**
   * Get a user's public profile by ID
   */
  getUserProfile: async (userId: number): Promise<UserProfile> => {
    try {
      return await api.get(`/users/${userId}`);
    } catch (error) {
      console.error(`Error getting user profile ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (profileData: ProfileUpdateRequest): Promise<UserProfile> => {
    // For file uploads, use custom FormData approach
    const formData = new FormData();

    Object.entries(profileData).forEach(([key, value]) => {
      // Handle nested objects
      if (key === 'social_media' && value) {
        Object.entries(value).forEach(([socialKey, socialValue]) => {
          if (socialValue) {
            formData.append(`social_media.${socialKey}`, String(socialValue));
          }
        });
      }
      // Handle arrays
      else if (key === 'languages' && Array.isArray(value)) {
        value.forEach((lang, index) => {
          formData.append(`languages[${index}]`, lang);
        });
      }
      // Handle regular fields including File objects
      else if (value !== undefined) {
        formData.append(key, value);
      }
    });

    // Custom fetch for FormData
    try {
      const response = await api.put('/users/me', formData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile with form data:', error);
      throw error;
    }
  },

  /**
   * Change user password
   */
  changePassword: async (
    passwordData: PasswordChangeRequest,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.post('/users/change-password', passwordData);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  /**
   * Request email verification
   */
  requestEmailVerification: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      return await api.post('/users/verify-email/request', {});
    } catch (error) {
      console.error('Error requesting email verification:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.post('/users/verify-email/confirm', { token });
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  /**
   * Get user payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      return await api.get('/users/payment-methods');
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  },

  /**
   * Add a new payment method
   */
  addPaymentMethod: async (paymentData: any): Promise<PaymentMethod> => {
    try {
      return await api.post('/users/payment-methods', paymentData);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (paymentMethodId: string): Promise<{ success: boolean }> => {
    try {
      return await api.delete(`/users/payment-methods/${paymentMethodId}`);
    } catch (error) {
      console.error(`Error deleting payment method ${paymentMethodId}:`, error);
      throw error;
    }
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<{ success: boolean }> => {
    try {
      return await api.put(`/users/payment-methods/${paymentMethodId}/default`, {});
    } catch (error) {
      console.error(`Error setting default payment method ${paymentMethodId}:`, error);
      throw error;
    }
  },
};

export default userService;
