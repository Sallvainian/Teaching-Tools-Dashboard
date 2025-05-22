// Updated database types with student features
export type UserRole = 'teacher' | 'student';

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          grade: string | null
          birth_date: string | null
          address: string | null
          phone_number: string | null
          parent_contact: string | null
          notes: string | null
          user_id: string | null
          auth_user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          grade?: string | null
          birth_date?: string | null
          address?: string | null
          phone_number?: string | null
          parent_contact?: string | null
          notes?: string | null
          user_id?: string | null
          auth_user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          grade?: string | null
          birth_date?: string | null
          address?: string | null
          phone_number?: string | null
          parent_contact?: string | null
          notes?: string | null
          user_id?: string | null
          auth_user_id?: string | null
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          grade_level: string | null
          subject: string | null
          school_year: string | null
          term: string | null
          join_code: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          grade_level?: string | null
          subject?: string | null
          school_year?: string | null
          term?: string | null
          join_code?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          grade_level?: string | null
          subject?: string | null
          school_year?: string | null
          term?: string | null
          join_code?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          user_id: string | null
          name: string
          settings: any | null
          is_public: boolean
          owner_role: UserRole
          last_modified: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          settings?: any | null
          is_public?: boolean
          owner_role?: UserRole
          last_modified?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          settings?: any | null
          is_public?: boolean
          owner_role?: UserRole
          last_modified?: string | null
          created_at?: string | null
        }
      }
      shared_games: {
        Row: {
          id: string
          game_id: string
          shared_with_id: string
          permission: 'view' | 'play' | 'edit'
          shared_at: string
        }
        Insert: {
          id?: string
          game_id: string
          shared_with_id: string
          permission?: 'view' | 'play' | 'edit'
          shared_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          shared_with_id?: string
          permission?: 'view' | 'play' | 'edit'
          shared_at?: string
        }
      }
      student_teachers: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string
          created_at?: string
        }
      }
      // ... other existing tables remain the same
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: ['teacher', 'student']
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']