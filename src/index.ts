import AgGrid from 'ag-grid-svelte5';
import makeSvelteCellRenderer from './makeSvelteCellRenderer.svelte';

export { AgGrid, makeSvelteCellRenderer };

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	graphql_public: {
		Tables: Record<string, never>
		Views: Record<string, never>
		Functions: {
			graphql: {
				Args: {
					operationName?: string
					query?: string
					variables?: Json
					extensions?: Json
				}
				Returns: Json
			}
		}
		Enums: Record<string, never>
		CompositeTypes: Record<string, never>
	}
	public: {
		Tables: {
			app_users: {
				Row: {
					avatar_url: string | null
					created_at: string
					email: string
					full_name: string
					id: string
					updated_at: string
				}
				Insert: {
					avatar_url?: string | null
					created_at?: string
					email: string
					full_name: string
					id?: string
					updated_at?: string
				}
				Update: {
					avatar_url?: string | null
					created_at?: string
					email?: string
					full_name?: string
					id?: string
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
					class_id: string
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
						foreignKeyName: "category_students_student_id_fkey"
						columns: ["student_id"]
						isOneToOne: false
						referencedRelation: "students"
						referencedColumns: ["id"]
					},
				]
			}
			class_students: {
				Row: {
					class_id: string
					created_at: string
					id: string
					student_id: string
				}
				Insert: {
					class_id: string
					created_at?: string
					id?: string
					student_id: string
				}
				Update: {
					class_id?: string
					created_at?: string
					id?: string
					student_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "class_students_class_id_fkey"
						columns: ["class_id"]
						isOneToOne: false
						referencedRelation: "classes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "class_students_student_id_fkey"
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
			gradebook_categories: {
				Row: {
					created_at: string | null
					id: string
					name: string
				}
				Insert: {
					created_at?: string | null
					id?: string
					name: string
				}
				Update: {
					created_at?: string | null
					id?: string
					name?: string
				}
				Relationships: []
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
			jeopardy_categories: {
				Row: {
					created_at: string | null
					game_id: string
					id: string
					name: string
					position: number
					updated_at: string | null
				}
				Insert: {
					created_at?: string | null
					game_id: string
					id?: string
					name: string
					position: number
					updated_at?: string | null
				}
				Update: {
					created_at?: string | null
					game_id?: string
					id?: string
					name?: string
					position?: number
					updated_at?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "jeopardy_categories_game_id_fkey"
						columns: ["game_id"]
						isOneToOne: false
						referencedRelation: "jeopardy_games"
						referencedColumns: ["id"]
					},
				]
			}
			jeopardy_games: {
				Row: {
					created_at: string | null
					date_created: string | null
					id: string
					last_modified: string | null
					name: string
					settings: Json | null
					updated_at: string | null
				}
				Insert: {
					created_at?: string | null
					date_created?: string | null
					id?: string
					last_modified?: string | null
					name: string
					settings?: Json | null
					updated_at?: string | null
				}
				Update: {
					created_at?: string | null
					date_created?: string | null
					id?: string
					last_modified?: string | null
					name?: string
					settings?: Json | null
					updated_at?: string | null
				}
				Relationships: []
			}
			jeopardy_questions: {
				Row: {
					answer: string
					category_id: string
					created_at: string | null
					id: string
					is_answered: boolean | null
					is_double_jeopardy: boolean | null
					point_value: number
					text: string
					time_limit: number | null
					updated_at: string | null
					wager: number | null
				}
				Insert: {
					answer: string
					category_id: string
					created_at?: string | null
					id?: string
					is_answered?: boolean | null
					is_double_jeopardy?: boolean | null
					point_value: number
					text: string
					time_limit?: number | null
					updated_at?: string | null
					wager?: number | null
				}
				Update: {
					answer?: string
					category_id?: string
					created_at?: string | null
					id?: string
					is_answered?: boolean | null
					is_double_jeopardy?: boolean | null
					point_value?: number
					text?: string
					time_limit?: number | null
					updated_at?: string | null
					wager?: number | null
				}
				Relationships: [
					{
						foreignKeyName: "jeopardy_questions_category_id_fkey"
						columns: ["category_id"]
						isOneToOne: false
						referencedRelation: "jeopardy_categories"
						referencedColumns: ["id"]
					},
				]
			}
			jeopardy_teams: {
				Row: {
					color: string
					created_at: string | null
					game_id: string
					id: string
					name: string
					score: number
					updated_at: string | null
				}
				Insert: {
					color: string
					created_at?: string | null
					game_id: string
					id?: string
					name: string
					score?: number
					updated_at?: string | null
				}
				Update: {
					color?: string
					created_at?: string | null
					game_id?: string
					id?: string
					name?: string
					score?: number
					updated_at?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "jeopardy_teams_game_id_fkey"
						columns: ["game_id"]
						isOneToOne: false
						referencedRelation: "jeopardy_games"
						referencedColumns: ["id"]
					},
				]
			}
			student_categories: {
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
						foreignKeyName: "student_categories_category_id_fkey"
						columns: ["category_id"]
						isOneToOne: false
						referencedRelation: "gradebook_categories"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "student_categories_student_id_fkey"
						columns: ["student_id"]
						isOneToOne: false
						referencedRelation: "students"
						referencedColumns: ["id"]
					},
				]
			}
			students: {
				Row: {
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
		Enums: Record<string, never>
		CompositeTypes: Record<string, never>
	}
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
			| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
			schema: keyof Database
		}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
		Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
			DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
			DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
			| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
			schema: keyof Database
		}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
			| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
			schema: keyof Database
		}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
			| keyof DefaultSchema["Enums"]
		| { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
			schema: keyof Database
		}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
			| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
			schema: keyof Database
		}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {},
	},
} as const

