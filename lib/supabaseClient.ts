import { createClient } from '@supabase/supabase-js';

// Safely access environment variables with fallback
const getEnvVar = (key: string) => {
  try {
    // Check if import.meta.env exists (Vite environment)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {
    return '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Use placeholders if keys are missing to prevent crash during initialization
// This allows the UI to render even if .env is not yet set up
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);