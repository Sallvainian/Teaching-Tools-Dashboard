// File Storage System Types

export interface FileFolder {
	id: string;
	user_id: string;
	name: string;
	parent_id: string | null;
	created_at: string;
	updated_at: string;
}

export interface FileMetadata {
	id: string;
	user_id: string;
	folder_id: string | null;
	storage_path: string;
	name: string;
	size: number; // Size in bytes
	type: string; // File extension (pdf, docx, etc.)
	mime_type: string | null;
	created_at: string;
	updated_at: string;
}

// Microsoft Teams-style permission levels
export type FilePermissionLevel = 'view' | 'edit' | 'contribute' | 'owner';
export type ShareScope = 'private' | 'class' | 'school' | 'public';

export interface FileShare {
	id: string;
	file_id: string;
	shared_with: string;
	shared_by: string;
	permission: FilePermissionLevel;
	share_scope: ShareScope;
	created_at: string;
	expires_at: string | null;
}

// Enhanced sharing system
export interface FilePermission {
	id: string;
	file_id: string;
	user_id?: string;
	class_id?: string;
	role?: 'teacher' | 'student' | 'admin';
	permission_level: FilePermissionLevel;
	share_scope: ShareScope;
	granted_by: string;
	granted_at: string;
	expires_at?: string;
}

export interface FileShareRequest {
	file_id: string;
	shared_with_type: 'user' | 'class' | 'role';
	shared_with_id?: string; // user_id or class_id
	shared_with_role?: 'teacher' | 'student';
	permission_level: FilePermissionLevel;
	share_scope: ShareScope;
	expires_at?: string;
	message?: string;
}

// Enhanced file types with permissions
export interface FileWithPermissions extends FileMetadata {
	current_user_permission: FilePermissionLevel;
	is_shared: boolean;
	share_count: number;
	can_reshare: boolean;
	folder?: FileFolder | null;
	shared_with?: Array<{
		type: 'user' | 'class' | 'role';
		name: string;
		permission_level: FilePermissionLevel;
		granted_at: string;
	}>;
}

export interface FolderWithPermissions extends FileFolder {
	current_user_permission: FilePermissionLevel;
	is_shared: boolean;
	files_count: number;
	subfolders_count: number;
	inherited_permissions: boolean;
	children?: FolderWithPermissions[];
	files?: FileWithPermissions[];
}

// Extended types with relations (legacy)
export interface FileFolderWithChildren extends FileFolder {
	children?: FileFolderWithChildren[];
	files?: FileMetadata[];
}

export interface FileMetadataWithFolder extends FileMetadata {
	folder?: FileFolder | null;
}

export interface FileShareWithDetails extends FileShare {
	file?: FileMetadata;
	shared_with_user?: {
		id: string;
		email: string;
		full_name?: string;
	};
	shared_by_user?: {
		id: string;
		email: string;
		full_name?: string;
	};
}

// File upload progress tracking
export interface FileUploadProgress {
	file: File;
	progress: number; // 0-100
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
}

// File stats for dashboard
export interface UserFileStats {
	user_id: string;
	total_files: number;
	total_folders: number;
	total_size_bytes: number;
	total_size_mb: number;
}

// Helper type for file icons
export const FILE_TYPE_ICONS: Record<string, string> = {
	// Documents
	pdf: '📄',
	doc: '📝',
	docx: '📝',
	txt: '📃',
	rtf: '📝',

	// Spreadsheets
	xls: '📊',
	xlsx: '📊',
	csv: '📊',

	// Presentations
	ppt: '📊',
	pptx: '📊',

	// Images
	jpg: '🖼️',
	jpeg: '🖼️',
	png: '🖼️',
	gif: '🖼️',
	svg: '🖼️',

	// Videos
	mp4: '🎥',
	avi: '🎥',
	mov: '🎥',
	wmv: '🎥',

	// Audio
	mp3: '🎵',
	wav: '🎵',
	m4a: '🎵',

	// Archives
	zip: '📦',
	rar: '📦',
	'7z': '📦',
	tar: '📦',

	// Code
	js: '💻',
	ts: '💻',
	html: '🌐',
	css: '🎨',
	json: '📋',

	// Default
	default: '📎'
};

// Helper function to get file icon
export function getFileIcon(fileType: string): string {
	return FILE_TYPE_ICONS[fileType.toLowerCase()] || FILE_TYPE_ICONS.default;
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file type from name
export function getFileType(fileName: string): string {
	const parts = fileName.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
}

// Storage limits (can be adjusted based on your needs)
export const STORAGE_LIMITS = {
	MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
	MAX_TOTAL_STORAGE: 1024 * 1024 * 1024, // 1GB total per user
	ALLOWED_FILE_TYPES: [
		// Documents
		'pdf',
		'doc',
		'docx',
		'txt',
		'rtf',
		'odt',
		// Spreadsheets
		'xls',
		'xlsx',
		'csv',
		'ods',
		// Presentations
		'ppt',
		'pptx',
		'odp',
		// Images
		'jpg',
		'jpeg',
		'png',
		'gif',
		'svg',
		'webp',
		// Videos
		'mp4',
		'avi',
		'mov',
		'wmv',
		'webm',
		// Audio
		'mp3',
		'wav',
		'm4a',
		'ogg',
		// Archives
		'zip',
		'rar',
		'7z',
		'tar',
		'gz',
		// Other
		'json',
		'xml'
	]
};

// Validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
	// Check file size
	if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size exceeds limit of ${formatFileSize(STORAGE_LIMITS.MAX_FILE_SIZE)}`
		};
	}

	// Check file type
	const fileType = getFileType(file.name);
	if (!STORAGE_LIMITS.ALLOWED_FILE_TYPES.includes(fileType)) {
		return {
			valid: false,
			error: `File type '${fileType}' is not allowed`
		};
	}

	return { valid: true };
}

// Microsoft Teams-style permission level definitions
export const PERMISSION_LEVELS = {
	view: {
		name: 'Can View',
		description: 'Can view and download files',
		capabilities: ['read', 'download'],
		color: 'blue'
	},
	edit: {
		name: 'Can Edit',
		description: 'Can view, edit, and download files',
		capabilities: ['read', 'download', 'edit', 'comment'],
		color: 'green'
	},
	contribute: {
		name: 'Can Contribute',
		description: 'Can view, edit, upload, and delete files',
		capabilities: ['read', 'download', 'edit', 'comment', 'upload', 'delete'],
		color: 'orange'
	},
	owner: {
		name: 'Owner',
		description: 'Full control including sharing and permissions',
		capabilities: [
			'read',
			'download',
			'edit',
			'comment',
			'upload',
			'delete',
			'share',
			'manage_permissions'
		],
		color: 'purple'
	}
} as const;

// Share scope definitions
export const SHARE_SCOPES = {
	private: {
		name: 'Private',
		description: 'Only you can access',
		icon: 'lock',
		color: 'gray'
	},
	class: {
		name: 'Class',
		description: 'Shared with specific classes',
		icon: 'users',
		color: 'blue'
	},
	school: {
		name: 'School',
		description: 'Shared with all teachers/students',
		icon: 'building',
		color: 'green'
	},
	public: {
		name: 'Public',
		description: 'Anyone with link can access',
		icon: 'globe',
		color: 'orange'
	}
} as const;

// Educational context types
export interface ClassContext {
	id: string;
	name: string;
	grade_level?: string;
	subject?: string;
	teacher_id: string;
	student_count: number;
}

export interface SchoolContext {
	id: string;
	name: string;
	district?: string;
	type: 'elementary' | 'middle' | 'high' | 'university';
}

// Helper functions for permissions
export function hasPermission(
	userPermission: FilePermissionLevel,
	requiredCapability: string
): boolean {
	const permissions = PERMISSION_LEVELS[userPermission];
	return permissions.capabilities.includes(requiredCapability);
}

export function canUserShare(userPermission: FilePermissionLevel): boolean {
	return hasPermission(userPermission, 'share');
}

export function canUserDelete(userPermission: FilePermissionLevel): boolean {
	return hasPermission(userPermission, 'delete');
}

export function getPermissionHierarchy(): FilePermissionLevel[] {
	return ['view', 'edit', 'contribute', 'owner'];
}

export function isHigherPermission(
	permission1: FilePermissionLevel,
	permission2: FilePermissionLevel
): boolean {
	const hierarchy = getPermissionHierarchy();
	return hierarchy.indexOf(permission1) > hierarchy.indexOf(permission2);
}
