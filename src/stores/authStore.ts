import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      set({ user: data.user, loading: false });
    } catch (error) {
      console.error('Error signing in:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred during sign in', 
        loading: false 
      });
    }
  },
  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) throw error;
      set({ loading: false });
      
      // Note: We don't set the user here because they need to verify their email first
      // Supabase handles this automatically based on the redirectTo URL
      
    } catch (error) {
      console.error('Error signing up:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred during sign up', 
        loading: false 
      });
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred during sign out', 
        loading: false 
      });
    }
  },
}));