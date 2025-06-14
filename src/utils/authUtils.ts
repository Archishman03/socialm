import { authService, UserProfile } from '@/services/firebase/auth';
import { User } from 'firebase/auth';

/**
 * Checks if a user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return authService.getCurrentUser() !== null;
};

/**
 * Retrieves the current user from Firebase
 */
export const getCurrentUser = (): User | null => {
  return authService.getCurrentUser();
};

/**
 * Log out the current user and redirect to login
 */
export const logoutUser = async () => {
  try {
    await authService.logout();
    window.location.href = '/login';
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login';
    throw error;
  }
};

/**
 * Register a new user with enhanced error handling
 */
export const registerUser = async (email: string, password: string, name: string, username: string) => {
  return await authService.register(email, password, name, username);
};

/**
 * Login a user with enhanced error handling
 */
export const loginUser = async (email: string, password: string) => {
  return await authService.login(email, password);
};

/**
 * Get user profile data with error handling
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  return await authService.getUserProfile(userId);
};

/**
 * Update user profile with error handling
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  return await authService.updateUserProfile(userId, updates);
};

/**
 * Reset password with error handling
 */
export const resetPassword = async (email: string) => {
  return await authService.resetPassword(email);
};