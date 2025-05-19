import { createClient } from '@supabase/supabase-js';

// Create the Supabase client
export const supabase = createClient(
  'https://yutlcpluuhjxwudfathv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGxjcGx1dWhqeHd1ZGZhdGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDk0MTgsImV4cCI6MjA2MjY4NTQxOH0.xUbla5RpsoqK9SKTL14li9lroXgimK4Zy8brPfzpVHc',
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// Initialize with minimal logic - no table creation or automatic login
export const initializeDB = async () => {
  try {
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Error in Supabase initialization:', error);
  }
};