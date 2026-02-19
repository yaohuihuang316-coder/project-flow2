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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTI2NDQsImV4cCI6MjA4MjU4ODY0NH0.xVb2gaNftckCN-gbA19iwHc0S0OD1XAc0Hf22LNBAvE';

// Use placeholders if keys are missing to prevent crash during initialization
// This allows the UI to render even if .env is not yet set up
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);