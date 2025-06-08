import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire app
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Initialize extension storage for Chrome extension
export const initializeExtensionStorage = async () => {
  // Check if we're in a Chrome extension environment
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);
      if (result.supabaseUrl && result.supabaseKey) {
        return createClient(result.supabaseUrl, result.supabaseKey);
      }
    } catch (error) {
      console.log('Chrome storage not available, using environment variables');
    }
  }
  return supabase;
};

// Function to save Supabase credentials to Chrome storage
export const saveSupabaseCredentials = async (url: string, key: string) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      await chrome.storage.local.set({
        supabaseUrl: url,
        supabaseKey: key
      });
      return true;
    } catch (error) {
      console.error('Failed to save credentials to Chrome storage:', error);
      return false;
    }
  }
  return false;
};