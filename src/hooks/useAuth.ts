import { useState, useEffect } from 'react';
import { User } from '../models';
import authService from '../services/authService';

// Extend the User type to include additional properties
declare module '../models' {
  interface User {
    id: string;
    uid: string;
    email: string;
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
    role: 'athlete' | 'admin';
    token?: string;
    preferences?: {
      workoutDuration?: number;
      equipment?: string[];
      goals?: string[];
    };
    profile?: {
      age?: number;
      weight?: number;
      height?: number;
      gender?: string;
      injuries?: string[];
    };
  }
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const [otpState, setOtpState] = useState({
    isOtpSent: false,
    isVerifying: false
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setAuthState({ user, loading: false, error: null });
      } catch (error) {
        setAuthState({ 
          user: null, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Authentication error' 
        });
      }
    };

    loadCurrentUser();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.signUp(email, password, displayName);
      setAuthState({ user, loading: false, error: null });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.signIn(email, password);
      setAuthState({ user, loading: false, error: null });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setAuthState({ user: null, loading: false, error: null });
      // Clear any stored tokens or user data
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // Alias for signOut to maintain consistency with other code
  const logout = signOut;

  const setupRecaptcha = (containerId?: string) => {
    authService.setupRecaptcha();
  };

  const sendOTP = async (phoneNumber: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await authService.sendOTP(phoneNumber);
      setOtpState({ isOtpSent: true, isVerifying: false });
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  };

  const verifyOTP = async (otp: string, displayName: string) => {
    try {
      setOtpState(prev => ({ ...prev, isVerifying: true }));
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await authService.verifyOTP(otp, displayName);
      
      setAuthState({ user, loading: false, error: null });
      setOtpState({ isOtpSent: false, isVerifying: false });
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      setOtpState(prev => ({ ...prev, isVerifying: false }));
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isOtpSent: otpState.isOtpSent,
    isVerifyingOtp: otpState.isVerifying,
    signUp,
    signIn,
    signOut,
    logout, // Alias for signOut
    setupRecaptcha,
    sendOTP,
    verifyOTP,
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  };
};
