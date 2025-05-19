import { supabase } from '$lib/supabaseClient';

export { supabase };

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

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
					class_id: string
					user_id?: string
				}
				Insert: {
					id?: string
					name: string
					class_id?: string
					user_id?: string
				}
				Update: {
					id?: string
					name?: string
					class_id?: string
					user_id?: string
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
			// Add the missing tables
			app_users: {
				Row: {
					id: string
					full_name?: string
					email?: string
					created_at?: string
					updated_at?: string
					avatar_url?: string
				}
				Insert: {
					id: string
					full_name?: string
					email?: string
					created_at?: string
					updated_at?: string
					avatar_url?: string
				}
				Update: {
					id?: string
					full_name?: string
					email?: string
					created_at?: string
					updated_at?: string
					avatar_url?: string
				}
				Relationships: []
			}
			jeopardy_games: {
				Row: {
					id: string
					name: string
					description?: string
					owner_id: string
					date_created: string
					last_modified: string
					settings?: any
				}
				Insert: {
					id?: string
					name: string
					description?: string
					owner_id: string
					date_created?: string
					last_modified?: string
					settings?: any
				}
				Update: {
					id?: string
					name?: string
					description?: string
					owner_id?: string
					date_created?: string
					last_modified?: string
					settings?: any
				}
				Relationships: []
			}
			jeopardy_categories: {
				Row: {
					id: string
					game_id: string
					name: string
					display_order: number
				}
				Insert: {
					id?: string
					game_id: string
					name: string
					display_order: number
				}
				Update: {
					id?: string
					game_id?: string
					name?: string
					display_order?: number
				}
				Relationships: []
			}
			jeopardy_questions: {
				Row: {
					id: string
					category_id: string
					text: string
					answer: string
					point_value: number
					is_answered: boolean
					is_double_jeopardy: boolean
					time_limit?: number
				}
				Insert: {
					id?: string
					category_id: string
					text: string
					answer: string
					point_value: number
					is_answered?: boolean
					is_double_jeopardy?: boolean
					time_limit?: number
				}
				Update: {
					id?: string
					category_id?: string
					text?: string
					answer?: string
					point_value?: number
					is_answered?: boolean
					is_double_jeopardy?: boolean
					time_limit?: number
				}
				Relationships: []
			}
			jeopardy_teams: {
				Row: {
					id: string
					game_id: string
					name: string
					score: number
					color: string
				}
				Insert: {
					id?: string
					game_id: string
					name: string
					score?: number
					color?: string
				}
				Update: {
					id?: string
					game_id?: string
					name?: string
					score?: number
					color?: string
				}
				Relationships: []
			}
			observation_logs: {
				Row: {
					id: string
					student_id: string
					date: string
					reason: string
					notes?: string
					mood?: string
					follow_up_actions?: string
					follow_up_date?: string
					resolved: boolean
					created_at: string
					updated_at: string
				}
				Insert: {
					id?: string
					student_id: string
					date: string
					reason: string
					notes?: string
					mood?: string
					follow_up_actions?: string
					follow_up_date?: string
					resolved?: boolean
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					student_id?: string
					date?: string
					reason?: string
					notes?: string
					mood?: string
					follow_up_actions?: string
					follow_up_date?: string
					resolved?: boolean
					created_at?: string
					updated_at?: string
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