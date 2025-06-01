export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			app_users: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					email: string;
					full_name: string;
					id: string;
					role: string | null;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					email: string;
					full_name: string;
					id?: string;
					role?: string | null;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					email?: string;
					full_name?: string;
					id?: string;
					role?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			assignments: {
				Row: {
					category_id: string;
					created_at: string | null;
					id: string;
					max_points: number;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					category_id: string;
					created_at?: string | null;
					id?: string;
					max_points: number;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					category_id?: string;
					created_at?: string | null;
					id?: string;
					max_points?: number;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'assignments_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'gradebook_categories';
						referencedColumns: ['id'];
					}
				];
			};
			categories: {
				Row: {
					class_id: string;
					created_at: string;
					description: string | null;
					id: string;
					name: string;
					updated_at: string;
					user_id: string | null;
					weight: number | null;
				};
				Insert: {
					class_id?: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					name: string;
					updated_at?: string;
					user_id?: string | null;
					weight?: number | null;
				};
				Update: {
					class_id?: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					name?: string;
					updated_at?: string;
					user_id?: string | null;
					weight?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'categories_class_id_fkey';
						columns: ['class_id'];
						isOneToOne: false;
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'categories_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			class_students: {
				Row: {
					class_id: string;
					created_at: string;
					id: string;
					student_id: string;
				};
				Insert: {
					class_id: string;
					created_at?: string;
					id?: string;
					student_id: string;
				};
				Update: {
					class_id?: string;
					created_at?: string;
					id?: string;
					student_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'class_students_class_id_fkey';
						columns: ['class_id'];
						isOneToOne: false;
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'class_students_student_id_fkey';
						columns: ['student_id'];
						isOneToOne: false;
						referencedRelation: 'students';
						referencedColumns: ['id'];
					}
				];
			};
			classes: {
				Row: {
					created_at: string;
					description: string | null;
					grade_level: string | null;
					id: string;
					join_code: string | null;
					name: string;
					school_year: string | null;
					subject: string | null;
					term: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					grade_level?: string | null;
					id?: string;
					join_code?: string | null;
					name: string;
					school_year?: string | null;
					subject?: string | null;
					term?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					grade_level?: string | null;
					id?: string;
					join_code?: string | null;
					name?: string;
					school_year?: string | null;
					subject?: string | null;
					term?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'classes_owner_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			conversation_participants: {
				Row: {
					conversation_id: string | null;
					id: string;
					is_active: boolean | null;
					is_admin: boolean | null;
					joined_at: string | null;
					last_read_at: string | null;
					notification_enabled: boolean | null;
					user_id: string | null;
				};
				Insert: {
					conversation_id?: string | null;
					id?: string;
					is_active?: boolean | null;
					is_admin?: boolean | null;
					joined_at?: string | null;
					last_read_at?: string | null;
					notification_enabled?: boolean | null;
					user_id?: string | null;
				};
				Update: {
					conversation_id?: string | null;
					id?: string;
					is_active?: boolean | null;
					is_admin?: boolean | null;
					joined_at?: string | null;
					last_read_at?: string | null;
					notification_enabled?: boolean | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'conversation_participants_conversation_id_fkey';
						columns: ['conversation_id'];
						isOneToOne: false;
						referencedRelation: 'conversation_list';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'conversation_participants_conversation_id_fkey';
						columns: ['conversation_id'];
						isOneToOne: false;
						referencedRelation: 'conversations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'conversation_participants_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			conversations: {
				Row: {
					avatar: string | null;
					created_at: string | null;
					created_by: string | null;
					id: string;
					is_group: boolean | null;
					name: string | null;
					updated_at: string | null;
				};
				Insert: {
					avatar?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					id?: string;
					is_group?: boolean | null;
					name?: string | null;
					updated_at?: string | null;
				};
				Update: {
					avatar?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					id?: string;
					is_group?: boolean | null;
					name?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'conversations_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			file_folders: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					parent_id: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					parent_id?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					parent_id?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'file_folders_parent_id_fkey';
						columns: ['parent_id'];
						isOneToOne: false;
						referencedRelation: 'file_folders';
						referencedColumns: ['id'];
					}
				];
			};
			file_metadata: {
				Row: {
					created_at: string;
					folder_id: string | null;
					id: string;
					mime_type: string | null;
					name: string;
					size: number;
					storage_path: string;
					type: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					folder_id?: string | null;
					id?: string;
					mime_type?: string | null;
					name: string;
					size: number;
					storage_path: string;
					type: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					folder_id?: string | null;
					id?: string;
					mime_type?: string | null;
					name?: string;
					size?: number;
					storage_path?: string;
					type?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'file_metadata_folder_id_fkey';
						columns: ['folder_id'];
						isOneToOne: false;
						referencedRelation: 'file_folders';
						referencedColumns: ['id'];
					}
				];
			};
			file_shares: {
				Row: {
					created_at: string;
					expires_at: string | null;
					file_id: string;
					id: string;
					permission: string | null;
					shared_by: string;
					shared_with: string;
				};
				Insert: {
					created_at?: string;
					expires_at?: string | null;
					file_id: string;
					id?: string;
					permission?: string | null;
					shared_by: string;
					shared_with: string;
				};
				Update: {
					created_at?: string;
					expires_at?: string | null;
					file_id?: string;
					id?: string;
					permission?: string | null;
					shared_by?: string;
					shared_with?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'file_shares_file_id_fkey';
						columns: ['file_id'];
						isOneToOne: false;
						referencedRelation: 'file_metadata';
						referencedColumns: ['id'];
					}
				];
			};
			game_categories: {
				Row: {
					category_name: string;
					created_at: string | null;
					game_id: string | null;
					id: string;
					order_index: number;
				};
				Insert: {
					category_name: string;
					created_at?: string | null;
					game_id?: string | null;
					id?: string;
					order_index: number;
				};
				Update: {
					category_name?: string;
					created_at?: string | null;
					game_id?: string | null;
					id?: string;
					order_index?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'game_categories_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					}
				];
			};
			games: {
				Row: {
					created_at: string | null;
					id: string;
					is_public: boolean | null;
					last_modified: string | null;
					name: string;
					owner_role: string | null;
					settings: Json | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					is_public?: boolean | null;
					last_modified?: string | null;
					name: string;
					owner_role?: string | null;
					settings?: Json | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					is_public?: boolean | null;
					last_modified?: string | null;
					name?: string;
					owner_role?: string | null;
					settings?: Json | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'games_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			gradebook_categories: {
				Row: {
					category_id: string | null;
					created_at: string | null;
					id: string;
					name: string;
				};
				Insert: {
					category_id?: string | null;
					created_at?: string | null;
					id?: string;
					name: string;
				};
				Update: {
					category_id?: string | null;
					created_at?: string | null;
					id?: string;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'gradebook_categories_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			grades: {
				Row: {
					assignment_id: string;
					created_at: string | null;
					id: string;
					points: number;
					student_id: string;
					updated_at: string | null;
				};
				Insert: {
					assignment_id: string;
					created_at?: string | null;
					id?: string;
					points: number;
					student_id: string;
					updated_at?: string | null;
				};
				Update: {
					assignment_id?: string;
					created_at?: string | null;
					id?: string;
					points?: number;
					student_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'grades_assignment_id_fkey';
						columns: ['assignment_id'];
						isOneToOne: false;
						referencedRelation: 'assignments';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'grades_student_id_fkey';
						columns: ['student_id'];
						isOneToOne: false;
						referencedRelation: 'students';
						referencedColumns: ['id'];
					}
				];
			};
			log_entries: {
				Row: {
					actions: string | null;
					date: string;
					follow_up: string | null;
					id: string;
					log_entry: string;
					student: string;
					tags: string[];
				};
				Insert: {
					actions?: string | null;
					date: string;
					follow_up?: string | null;
					id: string;
					log_entry: string;
					student: string;
					tags?: string[];
				};
				Update: {
					actions?: string | null;
					date?: string;
					follow_up?: string | null;
					id?: string;
					log_entry?: string;
					student?: string;
					tags?: string[];
				};
				Relationships: [];
			};
			message_attachments: {
				Row: {
					created_at: string | null;
					file_name: string;
					file_size: number | null;
					file_type: string;
					file_url: string;
					id: string;
					message_id: string;
				};
				Insert: {
					created_at?: string | null;
					file_name: string;
					file_size?: number | null;
					file_type: string;
					file_url: string;
					id?: string;
					message_id: string;
				};
				Update: {
					created_at?: string | null;
					file_name?: string;
					file_size?: number | null;
					file_type?: string;
					file_url?: string;
					id?: string;
					message_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'message_attachments_message_id_fkey';
						columns: ['message_id'];
						isOneToOne: false;
						referencedRelation: 'messages';
						referencedColumns: ['id'];
					}
				];
			};
			message_read_status: {
				Row: {
					id: string;
					message_id: string | null;
					read_at: string | null;
					user_id: string | null;
				};
				Insert: {
					id?: string;
					message_id?: string | null;
					read_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					id?: string;
					message_id?: string | null;
					read_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'message_read_status_message_id_fkey';
						columns: ['message_id'];
						isOneToOne: false;
						referencedRelation: 'messages';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'message_read_status_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			messages: {
				Row: {
					content: string;
					conversation_id: string | null;
					created_at: string | null;
					edited_at: string | null;
					id: string;
					is_deleted: boolean | null;
					message_type: string | null;
					metadata: Json | null;
					sender_id: string | null;
				};
				Insert: {
					content: string;
					conversation_id?: string | null;
					created_at?: string | null;
					edited_at?: string | null;
					id?: string;
					is_deleted?: boolean | null;
					message_type?: string | null;
					metadata?: Json | null;
					sender_id?: string | null;
				};
				Update: {
					content?: string;
					conversation_id?: string | null;
					created_at?: string | null;
					edited_at?: string | null;
					id?: string;
					is_deleted?: boolean | null;
					message_type?: string | null;
					metadata?: Json | null;
					sender_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'messages_conversation_id_fkey';
						columns: ['conversation_id'];
						isOneToOne: false;
						referencedRelation: 'conversation_list';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'messages_conversation_id_fkey';
						columns: ['conversation_id'];
						isOneToOne: false;
						referencedRelation: 'conversations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'messages_sender_id_fkey';
						columns: ['sender_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			questions: {
				Row: {
					answer_text: string;
					answered: boolean | null;
					category_id: string | null;
					created_at: string | null;
					id: string;
					is_daily_double: boolean | null;
					is_double_jeopardy: boolean | null;
					order_index: number;
					point_value: number;
					question_text: string;
					time_limit: number | null;
				};
				Insert: {
					answer_text: string;
					answered?: boolean | null;
					category_id?: string | null;
					created_at?: string | null;
					id?: string;
					is_daily_double?: boolean | null;
					is_double_jeopardy?: boolean | null;
					order_index: number;
					point_value: number;
					question_text: string;
					time_limit?: number | null;
				};
				Update: {
					answer_text?: string;
					answered?: boolean | null;
					category_id?: string | null;
					created_at?: string | null;
					id?: string;
					is_daily_double?: boolean | null;
					is_double_jeopardy?: boolean | null;
					order_index?: number;
					point_value?: number;
					question_text?: string;
					time_limit?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'questions_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'game_categories';
						referencedColumns: ['id'];
					}
				];
			};
			shared_games: {
				Row: {
					game_id: string | null;
					id: string;
					permission: string | null;
					shared_at: string | null;
					shared_with_id: string | null;
				};
				Insert: {
					game_id?: string | null;
					id?: string;
					permission?: string | null;
					shared_at?: string | null;
					shared_with_id?: string | null;
				};
				Update: {
					game_id?: string | null;
					id?: string;
					permission?: string | null;
					shared_at?: string | null;
					shared_with_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'shared_games_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'shared_games_shared_with_id_fkey';
						columns: ['shared_with_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			student_categories: {
				Row: {
					category_id: string;
					student_id: string;
				};
				Insert: {
					category_id: string;
					student_id: string;
				};
				Update: {
					category_id?: string;
					student_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'student_categories_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'gradebook_categories';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'student_categories_student_id_fkey';
						columns: ['student_id'];
						isOneToOne: false;
						referencedRelation: 'students';
						referencedColumns: ['id'];
					}
				];
			};
			students: {
				Row: {
					auth_user_id: string | null;
					created_at: string | null;
					email: string | null;
					id: string;
					name: string;
					notes: string | null;
					student_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					auth_user_id?: string | null;
					created_at?: string | null;
					email?: string | null;
					id?: string;
					name: string;
					notes?: string | null;
					student_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					auth_user_id?: string | null;
					created_at?: string | null;
					email?: string | null;
					id?: string;
					name?: string;
					notes?: string | null;
					student_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'students_owner_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			teams: {
				Row: {
					color: string;
					created_at: string | null;
					game_id: string | null;
					id: string;
					name: string;
					score: number | null;
					user_id: string | null;
				};
				Insert: {
					color: string;
					created_at?: string | null;
					game_id?: string | null;
					id?: string;
					name: string;
					score?: number | null;
					user_id?: string | null;
				};
				Update: {
					color?: string;
					created_at?: string | null;
					game_id?: string | null;
					id?: string;
					name?: string;
					score?: number | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'teams_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'teams_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			conversation_list: {
				Row: {
					avatar: string | null;
					created_at: string | null;
					id: string | null;
					is_group: boolean | null;
					last_message: Json | null;
					last_read_at: string | null;
					name: string | null;
					notification_enabled: boolean | null;
					participants: Json | null;
					unread_count: number | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'conversation_participants_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'app_users';
						referencedColumns: ['id'];
					}
				];
			};
			user_file_stats: {
				Row: {
					total_files: number | null;
					total_folders: number | null;
					total_size_bytes: number | null;
					total_size_mb: number | null;
					user_id: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			create_complete_class: {
				Args: { p_name: string; p_description?: string };
				Returns: Json;
			};
			create_default_folders: {
				Args: { user_id: string };
				Returns: undefined;
			};
			create_direct_conversation: {
				Args: { other_user_id: string };
				Returns: string;
			};
			create_group_conversation: {
				Args: { conversation_name: string; participant_ids: string[] };
				Returns: string;
			};
			create_log_entries_table: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			delete_class_completely: {
				Args: { p_class_id: string };
				Returns: boolean;
			};
			get_gradebook_classes: {
				Args: Record<PropertyKey, never>;
				Returns: Json;
			};
			get_gradebook_data: {
				Args: { p_class_id: string };
				Returns: Json;
			};
			get_gradebook_json: {
				Args: { p_class_id: string };
				Returns: Json;
			};
			get_or_create_direct_conversation: {
				Args: { other_user_id: string } | { user1_id: string; user2_id: string };
				Returns: string;
			};
			get_unread_count: {
				Args: { conv_id: string } | { conv_id: string; usr_id: string };
				Returns: number;
			};
			reset_all_gradebook_data: {
				Args: Record<PropertyKey, never>;
				Returns: Json;
			};
			reset_gradebook_cache: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			save_grade: {
				Args:
					| {
							p_assignment_id: string;
							p_student_id: string;
							p_points_earned: number;
							p_feedback?: string;
					  }
					| { p_student_id: string; p_assignment_id: string; p_points: number }
					| { p_student_id: string; p_assignment_id: string; p_points: number };
				Returns: string;
			};
			save_grade_json: {
				Args:
					| { grades_data: Json }
					| { p_student_id: string; p_assignment_id: string; p_points: number }
					| { p_student_id: string; p_assignment_id: string; p_points: number };
				Returns: Json;
			};
			update_class_name: {
				Args: { p_class_id: string; p_name: string; p_description?: string };
				Returns: Json;
			};
		};
		Enums: {
			user_role: 'teacher' | 'student';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			user_role: ['teacher', 'student']
		}
	}
} as const;

// Helper types for easier access
export type TablesRow<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type TablesInsertRow<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];
export type TablesUpdateRow<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

// Export user role type for convenience
export type UserRole = Database['public']['Enums']['user_role'];
