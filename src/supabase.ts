export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          name: string
          max_points: number
          category_id: string
        }
        Insert: {
          id?: string
          name: string
          max_points: number
          category_id: string
        }
        Update: {
          id?: string
          name?: string
          max_points?: number
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      category_students: {
        Row: {
          category_id: string
          student_id: string
        }
        Insert: {
          category_id: string
          student_id: string
        }
        Update: {
          category_id?: string
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
          }
        ]
      }
      grades: {
        Row: {
          id: string
          student_id: string
          assignment_id: string
          points: number
        }
        Insert: {
          id?: string
          student_id: string
          assignment_id: string
          points: number
        }
        Update: {
          id?: string
          student_id?: string
          assignment_id?: string
          points?: number
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
          }
        ]
      }
      students: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}