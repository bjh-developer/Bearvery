import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire app
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Initialize extension storage
export const initializeExtensionStorage = async () => {
  if (chrome.storage) {
    const { data } = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);
    if (data?.supabaseUrl && data?.supabaseKey) {
      return createClient(data.supabaseUrl, data.supabaseKey);
    }
  }
  return supabase;
};