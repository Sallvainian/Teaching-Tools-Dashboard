// src/lib/types/database.ts

export interface Database {
  public: {
    Tables: {
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
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          color: string | null
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          color?: string | null
          order_index?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          color?: string | null
          order_index?: number
        }
      }
      assignments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          max_points: number
          category_id: string
          due_date: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          max_points: number
          category_id: string
          due_date?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          max_points?: number
          category_id?: string
          due_date?: string | null
          description?: string | null
        }
      }
      grades: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          assignment_id: string
          points: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          assignment_id: string
          points: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          assignment_id?: string
          points?: number
        }
      }
      category_students: {
        Row: {
          category_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          category_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          category_id?: string
          student_id?: string
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          settings: any
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          settings?: any
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          settings?: any
        }
      }
      game_categories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          game_id: string
          name: string
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          game_id: string
          name: string
          order_index?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          game_id?: string
          name?: string
          order_index?: number
        }
      }
      questions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          category_id: string
          question: string
          answer: string
          points: number
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          category_id: string
          question: string
          answer: string
          points: number
          order_index?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          category_id?: string
          question?: string
          answer?: string
          points?: number
          order_index?: number
        }
      }
      observation_logs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          observer: string
          date: string
          student: string
          subject: string | null
          objective: string | null
          observation: string
          actions: string | null
          follow_up: string | null
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          observer: string
          date: string
          student: string
          subject?: string | null
          objective?: string | null
          observation: string
          actions?: string | null
          follow_up?: string | null
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          observer?: string
          date?: string
          student?: string
          subject?: string | null
          objective?: string | null
          observation?: string
          actions?: string | null
          follow_up?: string | null
          tags?: string[]
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}