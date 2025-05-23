import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const sb: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  website?: string;
  avatar_url?: string;
}

class SupabaseService {
  signUpStudent(email: string, password: string) {
    return sb.auth.signUp({ email, password });
  }

  signUpTeacher(email: string, password: string) {
    return sb.auth.signUp({ email, password });
  }

  resetPassword(email: string) {
    return sb.auth.resetPasswordForEmail(email);
  }

  getProfile(userId: string) {
    return sb.from('profiles').select('*').eq('id', userId).single<Profile>();
  }

  createProfile(profile: Profile) {
    return sb.from('profiles').insert(profile);
  }

  updateProfile(profile: Profile) {
    return sb.from('profiles').update(profile).eq('id', profile.id);
  }
}

export const supabaseService = new SupabaseService();
export type { User, Session };
