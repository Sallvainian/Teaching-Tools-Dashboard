export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          max_points: number
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          max_points: number
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          max_points?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gradebook_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_students: {
        Row: {
          category_id: string
          created_at: string
          student_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          student_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_students_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          join_code: string | null
          name: string
          school_year: string | null
          subject: string | null
          term: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          join_code?: string | null
          name: string
          school_year?: string | null
          subject?: string | null
          term?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          join_code?: string | null
          name?: string
          school_year?: string | null
          subject?: string | null
          term?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          last_modified: string | null
          name: string
          owner_role: string | null
          settings: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          last_modified?: string | null
          name: string
          owner_role?: string | null
          settings?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          last_modified?: string | null
          name?: string
          owner_role?: string | null
          settings?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_categories: {
        Row: {
          category_name: string
          created_at: string | null
          game_id: string | null
          id: string
          order_index: number
        }
        Insert: {
          category_name: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          order_index: number
        }
        Update: {
          category_name?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_categories_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          points: number
          student_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          points: number
          student_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          points?: number
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      log_entries: {
        Row: {
          actions: string | null
          date: string
          follow_up: string | null
          id: string
          log_entry: string
          student: string
          tags: string[]
        }
        Insert: {
          actions?: string | null
          date: string
          follow_up?: string | null
          id: string
          log_entry: string
          student: string
          tags?: string[]
        }
        Update: {
          actions?: string | null
          date?: string
          follow_up?: string | null
          id?: string
          log_entry?: string
          student?: string
          tags?: string[]
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_text: string
          answered: boolean | null
          category_id: string | null
          created_at: string | null
          id: string
          is_daily_double: boolean | null
          is_double_jeopardy: boolean | null
          order_index: number
          point_value: number
          question_text: string
          time_limit: number | null
        }
        Insert: {
          answer_text: string
          answered?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_daily_double?: boolean | null
          is_double_jeopardy?: boolean | null
          order_index: number
          point_value: number
          question_text: string
          time_limit?: number | null
        }
        Update: {
          answer_text?: string
          answered?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_daily_double?: boolean | null
          is_double_jeopardy?: boolean | null
          order_index?: number
          point_value?: number
          question_text?: string
          time_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "game_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "teacher" | "student"
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Export user role type for convenience
export type UserRole = Database['public']['Enums']['user_role']