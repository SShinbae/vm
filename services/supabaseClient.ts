
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '../types/database';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your app.config.js and .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;