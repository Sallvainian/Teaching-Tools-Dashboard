// Authentication types with role support
import type { User } from '@supabase/supabase-js';
import type { UserRole } from './database';

export interface AppUser extends User {
  role?: UserRole;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: AppUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  loading: boolean;
  error: string | null;
}

export interface StudentSignupData {
  email: string;
  password: string;
  fullName: string;
  joinCode?: string; // Optional class join code
}

export interface TeacherSignupData {
  email: string;
  password: string;
  fullName: string;
  schoolName?: string;
}